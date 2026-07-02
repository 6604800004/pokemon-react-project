import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

// ---------- ส่วนสุ่ม Pokemon รอบๆ ช่องค้นหา ----------

// รายชื่อ Pokemon ที่ fix ไว้ใช้สุ่มแสดง (แก้ id เพิ่ม/ลดได้ตามต้องการ)
const RANDOM_POKEMON_IDS = [
  1, 4, 7, 25, 39, 52, 54, 63, 74, 92, 95, 113, 129, 131, 133, 143, 150, 172, 175, 196,
];

// ดีเลย์ระหว่างการสุ่มแต่ละรอบ (ms) — ปรับตัวเลขนี้เพื่อเปลี่ยนความถี่การสุ่ม
const RANDOM_DELAY_MS = 60000;

// จำนวนวงกลมทั้งหมดรอบช่องค้นหา (1 วงใหญ่ตรงกลาง + 12 วงเล็กซ้าย-ขวา)
const RANDOM_BALL_COUNT = 13;

const BG_IMG_URL =
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

const BALL_POSITIONS: BallPosition[] = [
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
  if (RANDOM_POKEMON_IDS.length >= RANDOM_BALL_COUNT) {
    return shuffle(RANDOM_POKEMON_IDS).slice(0, RANDOM_BALL_COUNT);
  }
  // เผื่อกรณี pool มีน้อยกว่าจำนวนวง จะยอมให้ซ้ำได้ (ไม่งั้นจะไม่มีอะไรมาแสดงครบ)
  return Array.from(
    { length: RANDOM_BALL_COUNT },
    () => RANDOM_POKEMON_IDS[Math.floor(Math.random() * RANDOM_POKEMON_IDS.length)]
  );
};

/**
 * RandomPokemonBalls
 * แสดงวงกลม/สไปรท์ Pokemon สุ่ม 13 วงรอบช่องค้นหา
 * และสุ่มใหม่ทุกๆ RANDOM_DELAY_MS มิลลิวินาที
 */
function RandomPokemonBalls() {
  const nav = useNavigate();
  const [randomBallIds, setRandomBallIds] = useState<number[]>(pickUniqueBallIds);

  const goToDetail = (id: number) => {
    nav(`/PokeDex/${String(id).padStart(4, "0")}`);
  };

  // ตั้งเวลาสุ่มใหม่ทุกๆ RANDOM_DELAY_MS
  useEffect(() => {
    const timer = setInterval(() => {
      setRandomBallIds(pickUniqueBallIds());
    }, RANDOM_DELAY_MS);
    return () => clearInterval(timer);
  }, []);

  // จำกัดจำนวนวงที่ render ให้ตรงกับ RANDOM_BALL_COUNT จริงๆ
  // หมายเหตุ: ถ้าตั้ง RANDOM_BALL_COUNT มากกว่าจำนวนตำแหน่งที่มีใน BALL_POSITIONS
  // ต้องเพิ่ม object ตำแหน่งใหม่ (left/bgWidth/height/spriteWidth/z) เข้าไปใน BALL_POSITIONS ด้วย
  // เพราะแต่ละวงมีพิกัดเฉพาะที่ออกแบบไว้ ระบบไม่ได้สุ่มตำแหน่งเอง
  const visiblePositions = BALL_POSITIONS.slice(0, RANDOM_BALL_COUNT);

  return (
    <>
      {/* พื้นหลังวงกลม (background rings) */}
      {visiblePositions.map((pos, i) => (
        <div key={`bg-${i}`}>
          <img
            src={BG_IMG_URL}
            className="absolute bottom-0 -translate-x-1/2 object-contain pointer-events-none select-none"
            style={{ left: pos.left, width: pos.bgWidth, height: pos.height, zIndex: pos.z }}
            aria-hidden="true"
          />
        </div>
      ))}

      {/* สไปรท์ Pokemon ที่สุ่มได้ — คลิกได้ พาไปหน้า detail ของตัวนั้น */}
      {visiblePositions.map((pos, i) => (
        <div key={`sprite-${i}`}>
          <img
            src={pokemonSpriteUrl(randomBallIds[i])}
            className="absolute bottom-0 -translate-x-1/2 object-contain select-none cursor-pointer transition-transform"
            style={{ left: pos.left, width: pos.spriteWidth, height: pos.height, zIndex: pos.z }}
            alt={`pokemon-${randomBallIds[i]}`}
            onClick={() => goToDetail(randomBallIds[i])}
            onError={(e) => {
              e.currentTarget.style.opacity = "0";
            }}
          />
        </div>
      ))}
    </>
  );
}

export default RandomPokemonBalls;