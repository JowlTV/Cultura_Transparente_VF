import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svg = `
<svg width="1200" height="420" viewBox="0 0 1200 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Caprasimo&amp;family=Figtree:wght@700;800;900&amp;family=Plus+Jakarta+Sans:wght@800;900&amp;display=swap');
      .cult-script {
        font-family: 'Brush Script MT', 'Segoe Script', 'Snell Roundhand', cursive, sans-serif;
      }
      .circuito-geo {
        font-family: 'Figtree', 'Plus Jakarta Sans', 'Arial Rounded MT Bold', sans-serif;
        font-weight: 900;
      }
      .viamao-geo {
        font-family: 'Figtree', 'Plus Jakarta Sans', sans-serif;
        font-weight: 900;
        letter-spacing: 0.38em;
      }
    </style>
  </defs>

  <!-- Group: 'cult' in vivid purple #6A0DAD / #5c068c script -->
  <g fill="#6A0DAD">
    <!-- C curve -->
    <path d="M 180 80 C 130 80, 80 120, 55 180 C 30 240, 45 310, 105 340 C 160 365, 220 325, 235 270 C 240 250, 215 240, 205 258 C 185 295, 135 315, 95 295 C 60 275, 55 220, 75 175 C 95 130, 140 105, 185 105 C 220 105, 245 125, 255 155 C 260 170, 280 165, 280 145 C 275 110, 235 80, 180 80 Z" />
    
    <!-- u -->
    <path d="M 215 205 C 210 240, 215 285, 220 320 C 222 335, 245 335, 245 318 C 245 280, 250 235, 255 205 C 257 190, 235 190, 232 205 C 230 235, 232 270, 250 295 C 265 315, 290 315, 305 290 C 320 265, 325 225, 330 195 C 332 180, 310 180, 308 195 C 305 230, 300 270, 285 290 C 275 300, 260 300, 255 285 C 248 265, 248 230, 250 205 C 252 190, 217 190, 215 205 Z" />
    
    <!-- l -->
    <path d="M 330 110 C 325 150, 320 230, 320 290 C 320 325, 345 340, 375 330 C 390 325, 385 305, 370 310 C 355 315, 345 310, 345 290 C 345 235, 350 160, 355 110 C 358 85, 332 85, 330 110 Z" />
    
    <!-- t with dynamic expressive crossbar -->
    <!-- t upright -->
    <path d="M 390 60 C 385 100, 375 190, 370 260 C 365 310, 380 345, 420 340 C 445 335, 455 310, 440 300 C 425 290, 400 305, 395 280 C 392 250, 400 160, 410 70 C 412 45, 392 40, 390 60 Z" />
    
    <!-- t crossbar energetic slash -->
    <path d="M 315 130 C 365 120, 440 105, 490 95 C 505 92, 500 70, 485 73 C 435 83, 360 98, 310 110 C 295 113, 300 133, 315 130 Z" />
  </g>

  <!-- Group: 'circuito' in bright Orange #FF4500 bold geometric letters -->
  <g fill="#FF4500">
    <text x="445" y="270" class="circuito-geo" font-size="205" letter-spacing="-6">circuito</text>
  </g>

  <!-- Radiant Burst / Starburst at the top right of the 'o' in 'circuito' -->
  <g transform="translate(1085, 135)">
    <!-- Central core glow -->
    <circle cx="0" cy="0" r="16" fill="#FF4500" />
    
    <!-- 8 Main Long Tapered Rays (Star Polygon Points) -->
    <!-- North -->
    <polygon points="-6,0 0,-95 6,0" fill="#FF4500" />
    <!-- South -->
    <polygon points="-6,0 0,95 6,0" fill="#FF4500" />
    <!-- East -->
    <polygon points="0,-6 105,0 0,6" fill="#FF4500" />
    <!-- West -->
    <polygon points="0,-6 -95,0 0,6" fill="#FF4500" />
    
    <!-- Diagonals -->
    <!-- NE -->
    <polygon points="-4,-4 75,-75 4,4" fill="#FF4500" />
    <!-- NW -->
    <polygon points="4,-4 -68,-68 -4,4" fill="#FF4500" />
    <!-- SE -->
    <polygon points="-4,4 85,85 4,-4" fill="#FF4500" />
    <!-- SW -->
    <polygon points="4,4 -68,68 -4,-4" fill="#FF4500" />
    
    <!-- Intermediate Secondary Shorter Rays -->
    <polygon points="-3,-2 38,-72 3,2" fill="#FF4500" opacity="0.9" />
    <polygon points="-2,-3 72,-38 2,3" fill="#FF4500" opacity="0.9" />
    <polygon points="3,-2 -38,-72 -3,2" fill="#FF4500" opacity="0.9" />
    <polygon points="2,-3 -72,-38 -2,3" fill="#FF4500" opacity="0.9" />
    <polygon points="-3,2 38,72 3,-2" fill="#FF4500" opacity="0.9" />
    <polygon points="-2,3 72,38 2,-3" fill="#FF4500" opacity="0.9" />
  </g>

  <!-- Subtitle: 'VIAMÃO' centered below 'circuito' in Deep Purple #5c068c / #6A0DAD -->
  <g fill="#2D0652">
    <text x="765" y="385" text-anchor="middle" class="viamao-geo" font-size="80">VIAMÃO</text>
  </g>
</svg>
`;

async function render() {
  const assetsDir = path.resolve('src/assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const pngPath = path.join(assetsDir, 'cultcircuito-logo-color.png');
  await sharp(Buffer.from(svg))
    .png()
    .toFile(pngPath);

  console.log('Saved cultcircuito-logo-color.png to:', pngPath);
}

render().catch(console.error);
