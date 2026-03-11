use axum::{
    extract::Query,
    http::{header, StatusCode},
    response::IntoResponse,
    routing::get,
    Router,
};
use image::{ImageFormat, Rgba, RgbaImage};
use imageproc::drawing::draw_text_mut;
use ab_glyph::{FontRef, PxScale};
use serde::Deserialize;
use std::{fs, io::Cursor, sync::Arc};

#[derive(Deserialize)]
struct OgParams {
    title: String,
    #[serde(default)]
    tag: String,
    #[serde(default = "default_type")]
    og_type: String,
}

fn default_type() -> String {
    "Page".to_string()
}

// Shared application state to hold the font and template in memory
struct AppState {
    font_bold_data: Vec<u8>,
    template_img: RgbaImage,
}

#[tokio::main]
async fn main() {
    // Load assets on startup
    let font_bold_data = fs::read("assets/JetBrainsMono-Bold.ttf").expect("Failed to read font file");
    
    // Load the static PNG template once
    let img_data = fs::read("assets/template.png").expect("Failed to read PNG template");
    let template_img = image::load_from_memory(&img_data)
        .expect("Failed to decode PNG")
        .into_rgba8();

    let state = Arc::new(AppState {
        font_bold_data,
        template_img,
    });

    let app = Router::new()
        .route("/generate", get(generate_og))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3006").await.unwrap();
    println!("OG Generator listening on http://127.0.0.1:3006/generate");
    axum::serve(listener, app).await.unwrap();
}

async fn generate_og(
    Query(params): Query<OgParams>,
    axum::extract::State(state): axum::extract::State<Arc<AppState>>,
) -> impl IntoResponse {
    let font = FontRef::try_from_slice(&state.font_bold_data).unwrap();

    // 1. Clone the base template for this request
    let mut image = state.template_img.clone();

    // 2. Setup colors for dark mode
    let title_color = Rgba([248, 250, 252, 255]); // slate-50
    let brand_dark = Rgba([167, 139, 250, 255]); // violet-400 for the type label
    let gray = Rgba([148, 163, 184, 255]); // slate-400
    let light_gray = Rgba([100, 116, 139, 255]); // slate-500 for bottom text

    let start_x = 100;

    // 3. Draw Metadata (Type / Tag) above the title
    let meta_scale = PxScale::from(28.0);
    let type_text = format!("[ {} ]", params.og_type.to_uppercase());
    draw_text_mut(&mut image, brand_dark, start_x, 220, meta_scale, &font, &type_text);
    
    if !params.tag.is_empty() {
        let tag_text = format!("#{}", params.tag.to_lowercase());
        // Calculate rough width of type text to place tag next to it
        let type_width = type_text.len() as i32 * 17; 
        draw_text_mut(&mut image, gray, start_x + type_width + 20, 220, meta_scale, &font, &tag_text);
    }

    // 4. Draw Title (Multi-line)
    let title_scale = PxScale::from(72.0);
    let title_y = 280;
    
    let max_chars_per_line = 28;
    let words: Vec<&str> = params.title.split_whitespace().collect();
    let mut current_line = String::new();
    let mut y_offset = title_y;
    
    for word in words {
        if current_line.len() + word.len() > max_chars_per_line {
            draw_text_mut(&mut image, title_color, start_x, y_offset, title_scale, &font, &current_line);
            current_line = String::new();
            y_offset += 85;
        }
        current_line.push_str(word);
        current_line.push(' ');
    }
    if !current_line.is_empty() {
        draw_text_mut(&mut image, title_color, start_x, y_offset, title_scale, &font, &current_line);
    }

    // 5. Draw Footer (Branding)
    let footer_scale = PxScale::from(24.0);
    draw_text_mut(&mut image, light_gray, start_x, 540, footer_scale, &font, "eddn.dev // ARCHITECTURE. PERFORMANCE. SYSTEMS.");

    // 6. Encode to PNG
    let mut buffer = Cursor::new(Vec::new());
    image.write_to(&mut buffer, ImageFormat::Png).unwrap();

    (
        StatusCode::OK,
        [(header::CONTENT_TYPE, "image/png")],
        buffer.into_inner(),
    )
}
