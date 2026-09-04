# Ajustar la animación del footer

Los valores se editan en
[`src/scripts/features/footer-film.js`](../src/scripts/features/footer-film.js).
El bloque `wideFilm` define el perfil amplio y los valores heredados;
`FOOTER_FILM_PROFILES` contiene las variantes `compact` y `medium`.

El perfil depende del ancho del dibujo, no del ancho total del navegador.

| Perfil | Ancho disponible | Rejilla | Velocidad |
| --- | --- | --- | --- |
| `compact` | Menos de 480 px | 48 × 24 | 4 px/s |
| `medium` | De 480 a menos de 640 px | 72 × 36 | 6 px/s |
| `wide` | Desde 640 px | 96 × 48 | 12 px/s |

## Controles por perfil

| Propiedad | Efecto al aumentarla |
| --- | --- |
| `speed` | La rejilla se desplaza más rápido; se mide en píxeles CSS por segundo. |
| `ignitionDelay` | Aumenta la separación temporal entre filas al encenderse. |
| `extinctionDelay` | Aumenta la separación temporal entre filas al apagarse. |
| `ignitionDuration` | Cada LED tarda más en aparecer; se mide en milisegundos. |
| `extinctionDuration` | Cada LED tarda más en desaparecer; se mide en milisegundos. |
| `morphDuration` | Suaviza durante más tiempo los cambios entre estados activos, en milisegundos. |
| `columns`, `rows` | Añaden puntos al dibujo y reducen su tamaño aparente al encajarlo. |
| `ledSize`, `pitch` | Definen el diámetro máximo y la distancia entre centros antes del ajuste al contenedor. |
| `sizes` | Define multiplicadores del diámetro por estado, del borde tenue al núcleo brillante. |

Ledding 2.1 mide los `Delay` en fotogramas de actualización, no en milisegundos.
La animación trabaja a 30 FPS: `ignitionDelay: 0.6` representa unos 20 ms por fila
antes del redondeo a fotogramas. Las filas acumulan ese retraso según la dirección.
Por ejemplo, cambiar `compact.ignitionDelay` de `0.8` a `0.9` separa más su encendido.

En pantallas pequeñas, conserva tiempo suficiente entre columnas para que los
LEDs terminen de encenderse. Una velocidad alta, muchos puntos y retrasos largos
pueden volver a producir parpadeo.

## Dirección, patrón y forma

En [`footer-signal-runtime.js`](../src/scripts/features/footer-signal-runtime.js),
el bloque `animation` controla el desplazamiento hacia la izquierda, la aparición
en cascada hacia arriba y la desaparición en cascada hacia abajo. El bloque
`transitions` controla las curvas de suavizado; `pixelRatio: 'auto'` conserva la
resolución de la pantalla.

La función `createFooterFilm` de `footer-film.js` define las dos cintas curvas y
sus niveles de intensidad. La forma es fija y la rejilla se mueve a través de ella.
El SVG estático comparte esos mismos perfiles y sirve cuando se reduce el movimiento.

Si cambias los umbrales `minWidth`, actualiza también las consultas `@container`
de [`src/styles/footer.css`](../src/styles/footer.css) para que coincidan con el SVG.

Después de ajustar, ejecuta `npm test` y `npm run build`, y revisa el footer en
móvil y escritorio. Las pruebas de `tests/footer-signal.test.mjs` comprueban los
límites de tiempo, las cascadas, la pausa y los cambios de densidad.
