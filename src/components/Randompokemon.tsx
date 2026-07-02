import { useState, useEffect } from "react";

// ---------- ส่วนสุ่ม Pokemon รอบๆ ช่องค้นหา ----------

// รายชื่อ Pokemon ที่ fix ไว้ใช้สุ่มแสดง (แก้ id เพิ่ม/ลดได้ตามต้องการ)
const pokemon_id = [
  1, 4, 7, 25, 39, 52, 54, 63, 74, 92, 95, 113, 129, 131, 133, 143, 150, 172, 175, 196,
  200, 205, 212, 214, 218, 222, 231, 246, 252, 258, 263, 270, 274, 278, 283, 290
];

// ดีเลย์ระหว่างการสุ่มแต่ละรอบ (ms) — ปรับตัวเลขนี้เพื่อเปลี่ยนความถี่การสุ่ม
const random_delay = 10000;

// จำนวนวงกลมทั้งหมดรอบช่องค้นหา (1 วงใหญ่ตรงกลาง + 12 วงเล็กซ้าย-ขวา)
const random_center_bg = 13;

const random_center_bg_img =
  "https://th.portal-pokemon.com/play/resources/pokedex/img/random_center_bg.png";

const pokemonSpriteUrl = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

// ตำแหน่ง/ขนาดของแต่ละวง เรียงตามลำดับเดิม (index 0 = วงกลางใหญ่)
type BallPosition = {
  left: number;
  bgWidth: number;
  height: number;
  spriteWidth: number;
  z: number;
};

const pokemon_position: BallPosition[] = [
  { left: 550, bgWidth: 300, height: 550, spriteWidth: 260, z: 40 },
  { left: 340, bgWidth: 130, height: 400, spriteWidth: 110, z: 10 },
  { left: 340, bgWidth: 130, height: 700, spriteWidth: 110, z: 10 },
  { left: 230, bgWidth: 130, height: 550, spriteWidth: 110, z: 10 },
  { left: 115, bgWidth: 130, height: 400, spriteWidth: 110, z: 10 },
  { left: 115, bgWidth: 130, height: 700, spriteWidth: 110, z: 10 },
  { left: 5, bgWidth: 130, height: 550, spriteWidth: 110, z: 10 },
  { left: 750, bgWidth: 130, height: 400, spriteWidth: 110, z: 10 },
  { left: 750, bgWidth: 130, height: 700, spriteWidth: 110, z: 10 },
  { left: 865, bgWidth: 130, height: 550, spriteWidth: 110, z: 10 },
  { left: 980, bgWidth: 130, height: 400, spriteWidth: 110, z: 10 },
  { left: 980, bgWidth: 130, height: 700, spriteWidth: 110, z: 10 },
  { left: 1100, bgWidth: 130, height: 550, spriteWidth: 110, z: 10 },
];

// สลับลำดับ array แบบสุ่ม (Fisher–Yates shuffle)
const shuffle = <T,>(arr: T[]) => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// สุ่ม Pokemon ให้ครบทุกวงในครั้งเดียว โดย "ไม่ให้ซ้ำกันเองระหว่างวง"
// (เดิมสุ่มอิสระทีละวง ทำให้มีโอกาสได้ id ซ้ำกันสูง เพราะ pool มีจำกัดเทียบกับจำนวนวง)
const pickUniqueBallIds = () => {
  if (pokemon_id.length >= random_center_bg) {
    return shuffle(pokemon_id).slice(0, random_center_bg);
  }
  // เผื่อกรณี pool มีน้อยกว่าจำนวนวง จะยอมให้ซ้ำได้ (ไม่งั้นจะไม่มีอะไรมาแสดงครบ)
  return Array.from(
    { length: random_center_bg },
    () => pokemon_id[Math.floor(Math.random() * pokemon_id.length)]
  );
};

function RandomPokemon() {
  const [randomBallId, setrandomBallId] = useState<number[]>(pickUniqueBallIds);

  // ตั้งเวลาสุ่มใหม่ทุกๆ random_delay
  useEffect(() => {
    const timer = setInterval(() => {
      setrandomBallId(pickUniqueBallIds());
    }, random_delay);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {pokemon_position.map((pos, i) => (
        <div key={`bg-${i}`}>
          <img
            src={random_center_bg_img}
            className="absolute bottom-0 -translate-x-1/2 object-contain pointer-events-none select-none"
            style={{ left: pos.left, width: pos.bgWidth, height: pos.height, zIndex: pos.z }}
            aria-hidden="true"
          />
        </div>
      ))}

      {/* สไปรท์ Pokemon ที่สุ่มได้ */}
      {pokemon_position.map((pos, i) => (
        <div key={`sprite-${i}`}>
          <img
            src={pokemonSpriteUrl(randomBallId[i])}
            className="absolute bottom-0 -translate-x-1/2 object-contain pointer-events-none select-none"
            style={{ left: pos.left, width: pos.spriteWidth, height: pos.height, zIndex: pos.z }}
            aria-hidden="true"
            onError={(e) => {
              e.currentTarget.style.opacity = "0";
            }}
          />
        </div>
      ))}
    </>
  );
}

export default RandomPokemon;