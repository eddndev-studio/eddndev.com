import { gsap } from "gsap";

export function initCursor() {
    const isDesktop = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isDesktop || prefersReducedMotion) return;

    const cursor = document.getElementById("custom-cursor");
    const label = document.getElementById("cursor-label");

    if (!cursor || !label) return;

    // Enable custom cursor styles (hides system cursor via CSS)
    document.documentElement.classList.add("custom-cursor-active");

    // State
    let mouseX = 0;
    let mouseY = 0;
    let currentTarget = null; // Elemento interactivo actual

    // Config
    const baseSize = 16;
    const hoverSize = 80;

    // Initial Setup
    gsap.set(cursor, { xPercent: -50, yPercent: -50, backgroundColor: "#ffffff", mixBlendMode: "difference" });
    
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.2, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.2, ease: "power3" });

    // --- Core Logic: Update Cursor State ---
    function updateCursorState(target) {
        // Si el target es el mismo, no hacer nada
        if (currentTarget === target) return;
        
        currentTarget = target;

        if (target) {
            // ENTER STATE
            const actionText = target.getAttribute("data-cursor-text") || "CLICK";
            
            gsap.killTweensOf(label);

            gsap.to(cursor, { 
                width: hoverSize,
                height: hoverSize,
                backgroundColor: "#8b5cf6",
                mixBlendMode: "normal",
                duration: 0.3, 
                ease: "back.out(1.7)",
                overwrite: "auto"
            });
            
            label.innerText = actionText;
            gsap.to(label, { opacity: 1, duration: 0.2, delay: 0.05 });

        } else {
            // LEAVE STATE
            gsap.killTweensOf(label);

            gsap.to(cursor, { 
                width: baseSize,
                height: baseSize,
                backgroundColor: "#ffffff",
                mixBlendMode: "difference",
                duration: 0.3, 
                ease: "power2.out",
                overwrite: "auto"
            });

            gsap.to(label, { 
                opacity: 0, 
                duration: 0.1,
                onComplete: () => { if(!currentTarget) label.innerText = ""; }
            });
        }
    }

    // --- Check for Interactive Elements ---
    function checkInteractivity() {
        // Obtener el elemento bajo el cursor
        const el = document.elementFromPoint(mouseX, mouseY);
        if (!el) return;

        // Buscar si el elemento o alguno de sus padres es interactivo
        // Buscamos selectores: a, button, .interactive, [data-cursor-text]
        const target = el.closest('a, button, .interactive, [data-cursor-text]');

        updateCursorState(target);
    }

    // --- Event Listeners ---

    // 1. Mouse Move
    window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        xTo(mouseX);
        yTo(mouseY);

        // Check interactivity on move
        checkInteractivity();
    });

    // 2. Scroll (The fix for your issue)
    window.addEventListener("scroll", () => {
        // Check interactivity on scroll using the last known mouse position
        checkInteractivity();
    }, { passive: true });


    // Visibility Handlers
    document.addEventListener("mouseleave", () => gsap.to(cursor, { opacity: 0 }));
    document.addEventListener("mouseenter", () => gsap.to(cursor, { opacity: 1 }));
}