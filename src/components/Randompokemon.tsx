import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { CDN, ASSETS_Base, OFFICIAL_URL} from "../config";

const RANDOM_POKEMON_IDS = [
  1, 4, 6, 7, 9, 25, 37, 38, 39, 52, 54, 63, 74, 92, 94, 95, 113, 129, 130,
  131, 133, 143, 149, 150, 172, 175, 196, 200, 201, 202, 203, 204, 205, 206,
  207, 208, 210, 211, 212, 213, 214, 215, 217, 248, 300, 305, 306, 307, 384,
  445, 448, 658, 700, 778, 812, 888,
];

// ตั้งเวลาการสุ่ม
const RANDOM_DELAY_SECONDS = 20;
const RANDOM_DELAY_MS = RANDOM_DELAY_SECONDS * 1000;

const BG_IMG_URL = `${ASSETS_Base}/random_center_bg.png`;

const RING_IMG_URL = `${ASSETS_Base}/random_bg.png`;

const pokemonSpriteUrl = (id: number) =>
  `${CDN}/sprites/pokemon/other/official-artwork/${id}.png`;

const pokemonSpriteFallbackUrl = (id: number) =>
  `${OFFICIAL_URL}/${id}.png}`;

// jsdelivr เป็น CDN สาธารณะ บางครั้งโหลดพลาด/ไม่เจอไฟล์ในแคช ลองสำรองที่ต้นทาง raw github ก่อนซ่อนรูปทิ้ง
const handleSpriteError = (id: number) => (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  const fallback = pokemonSpriteFallbackUrl(id);
  if (img.src !== fallback) {
    img.src = fallback;
  } else {
    img.style.opacity = "0";
  }
};

const pickUniqueIds = (n: number): number[] => {
  const shuffled = [...RANDOM_POKEMON_IDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};

function RandomPokemonBalls() {
  const nav = useNavigate();
  const [ids, setIds] = useState<number[]>(() => pickUniqueIds(13));
  const centerId = ids[12];

  const goToDetail = (id: number) => {
    nav(`/PokeDex/${id}`);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setIds(pickUniqueIds(13));
    }, RANDOM_DELAY_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative pointer-events-none">
      {/* วงกลาง */}
      <div className="absolute inset-0 flex items-center justify-center -translate-y-[180px] -translate-x-[-210px] pointer-events-auto">
        <img
          src={BG_IMG_URL}
          className="h-[300px] w-[300px] object-contain select-none pointer-events-none"
          aria-hidden="true"
        />
        <img
          src={pokemonSpriteUrl(centerId)}
          className="absolute h-[260px] w-[260px] object-contain select-none cursor-pointer transition-transform"
          alt={`pokemon-${centerId}`}
          onClick={() => goToDetail(centerId)}
          onError={handleSpriteError(centerId)}
        />
      </div>

      {/* เล็ก-กลางซ้าย*/}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[190px] -translate-x-[110px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[120px] w-[120px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[0])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[0]}`}
            onClick={() => goToDetail(ids[0])}
            onError={handleSpriteError(ids[0])}
          />
        </div>
      </div>

      {/* เล็ก-กลางซ้ายสุด */}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[190px] -translate-x-[325px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[120px] w-[120px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[1])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[1]}`}
            onClick={() => goToDetail(ids[1])}
            onError={handleSpriteError(ids[1])}
          />
        </div>
      </div>

      {/* เล็ก-ซ้ายบนสุด */}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[270px] -translate-x-[215px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[120px] w-[120px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[2])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[2]}`}
            onClick={() => goToDetail(ids[2])}
            onError={handleSpriteError(ids[2])}
          />
        </div>
      </div>

      {/* เล็ก-ซ้ายล่างสุด */}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[110px] -translate-x-[215px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[120px] w-[120px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[3])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[3]}`}
            onClick={() => goToDetail(ids[3])}
            onError={handleSpriteError(ids[3])}
          />
        </div>
      </div>

      {/* เล็ก-ซ้ายบน */}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[270px] -translate-x-[4px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[120px] w-[120px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[4])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[4]}`}
            onClick={() => goToDetail(ids[4])}
            onError={handleSpriteError(ids[4])}
          />
        </div>
      </div>

      {/* เล็ก-ซ้ายล่าง */}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[110px] -translate-x-[4px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[120px] w-[120px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[5])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[5]}`}
            onClick={() => goToDetail(ids[5])}
            onError={handleSpriteError(ids[5])}
          />
        </div>
      </div>

      {/* เล็ก-ขวาล่าง */}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[110px] -translate-x-[-420px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[120px] w-[120px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[6])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[6]}`}
            onClick={() => goToDetail(ids[6])}
            onError={handleSpriteError(ids[6])}
          />
        </div>
      </div>

      {/* เล็ก-ขวาล่างสุด */}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[110px] -translate-x-[-630px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[120px] w-[120px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[7])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[7]}`}
            onClick={() => goToDetail(ids[7])}
            onError={handleSpriteError(ids[7])}
          />
        </div>
      </div>

      {/* เล็ก-ขวาบน */}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[270px] -translate-x-[-420px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[120px] w-[120px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[8])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[8]}`}
            onClick={() => goToDetail(ids[8])}
            onError={handleSpriteError(ids[8])}
          />
        </div>
      </div>

      {/* เล็ก-ขวาบนสุด */}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[270px] -translate-x-[-630px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[120px] w-[120px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[9])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[9]}`}
            onClick={() => goToDetail(ids[9])}
            onError={handleSpriteError(ids[9])}
          />
        </div>
      </div>

      {/* เล็ก-กลางขวา*/}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[190px] -translate-x-[-525px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[120px] w-[120px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[10])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[10]}`}
            onClick={() => goToDetail(ids[10])}
            onError={handleSpriteError(ids[10])}
          />
        </div>
      </div>

      {/* เล็ก-กลางขวาสุด */}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[190px] -translate-x-[-745px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[120px] w-[120px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[11])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[11]}`}
            onClick={() => goToDetail(ids[11])}
            onError={handleSpriteError(ids[11])}
          />
        </div>
      </div>
    </div>
  );
}

export default RandomPokemonBalls;