import { useState, useEffect } from "react";
import { useNavigate } from "react-router";


const RANDOM_POKEMON_IDS = [
  1, 4, 7, 25, 37, 38, 39, 52, 54, 63, 74, 92, 95, 113, 129, 131, 133, 143, 150, 
  172, 175, 196, 200, 201, 202, 203, 204, 205, 206, 207, 208, 210, 211, 212, 213, 
  214, 215, 217, 300, 305, 306, 307
];

// ตั้งเวลาการสุ่ม
const RANDOM_DELAY_SECONDS = 20;
const RANDOM_DELAY_MS = RANDOM_DELAY_SECONDS * 1000;

const BG_IMG_URL =
  "https://th.portal-pokemon.com/play/resources/pokedex/img/random_center_bg.png";

const RING_IMG_URL =
  "https://th.portal-pokemon.com/play/resources/pokedex/img/random_bg.png";

const pokemonSpriteUrl = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

const pickUniqueIds = (n: number): number[] => {
  const shuffled = [...RANDOM_POKEMON_IDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};

function RandomPokemonBalls() {
  const nav = useNavigate();
  const [ids, setIds] = useState<number[]>(() => pickUniqueIds(13));
  const centerId = ids[12];

  const goToDetail = (id: number) => {
    nav(`/PokeDex/${String(id).padStart(4, "0")}`);
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
          onError={(e) => {
            e.currentTarget.style.opacity = "0";
          }}
        />
      </div>

      {/* เล็ก-กลางซ้าย*/}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[180px] -translate-x-[150px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[125px] w-[125px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[0])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[0]}`}
            onClick={() => goToDetail(ids[0])}
            onError={(e) => {
              e.currentTarget.style.opacity = "0";
            }}
          />
        </div>
      </div>

      {/* เล็ก-กลางซ้ายสุด */}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[180px] -translate-x-[350px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[125px] w-[125px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[1])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[1]}`}
            onClick={() => goToDetail(ids[1])}
            onError={(e) => {
              e.currentTarget.style.opacity = "0";
            }}
          />
        </div>
      </div>

      {/* เล็ก-ซ้ายบนสุด */}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[270px] -translate-x-[250px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[125px] w-[125px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[2])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[2]}`}
            onClick={() => goToDetail(ids[2])}
            onError={(e) => {
              e.currentTarget.style.opacity = "0";
            }}
          />
        </div>
      </div>

      {/* เล็ก-ซ้ายล่างสุด */}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[90px] -translate-x-[250px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[125px] w-[125px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[3])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[3]}`}
            onClick={() => goToDetail(ids[3])}
            onError={(e) => {
              e.currentTarget.style.opacity = "0";
            }}
          />
        </div>
      </div>

      {/* เล็ก-ซ้ายบน */}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[270px] -translate-x-[50px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[125px] w-[125px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[4])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[4]}`}
            onClick={() => goToDetail(ids[4])}
            onError={(e) => {
              e.currentTarget.style.opacity = "0";
            }}
          />
        </div>
      </div>

      {/* เล็ก-ซ้ายล่าง */}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[90px] -translate-x-[50px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[125px] w-[125px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[5])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[5]}`}
            onClick={() => goToDetail(ids[5])}
            onError={(e) => {
              e.currentTarget.style.opacity = "0";
            }}
          />
        </div>
      </div>

      {/* เล็ก-ขวาล่าง */}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[90px] -translate-x-[-470px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[125px] w-[125px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[6])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[6]}`}
            onClick={() => goToDetail(ids[6])}
            onError={(e) => {
              e.currentTarget.style.opacity = "0";
            }}
          />
        </div>
      </div>

      {/* เล็ก-ขวาล่างสุด */}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[90px] -translate-x-[-670px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[125px] w-[125px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[7])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[7]}`}
            onClick={() => goToDetail(ids[7])}
            onError={(e) => {
              e.currentTarget.style.opacity = "0";
            }}
          />
        </div>
      </div>

      {/* เล็ก-ขวาบน */}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[270px] -translate-x-[-470px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[125px] w-[125px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[8])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[8]}`}
            onClick={() => goToDetail(ids[8])}
            onError={(e) => {
              e.currentTarget.style.opacity = "0";
            }}
          />
        </div>
      </div>

      {/* เล็ก-ขวาบนสุด */}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[270px] -translate-x-[-670px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[125px] w-[125px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[9])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[9]}`}
            onClick={() => goToDetail(ids[9])}
            onError={(e) => {
              e.currentTarget.style.opacity = "0";
            }}
          />
        </div>
      </div>

       {/* เล็ก-กลางขวา*/}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[180px] -translate-x-[-570px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[125px] w-[125px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[10])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[10]}`}
            onClick={() => goToDetail(ids[10])}
            onError={(e) => {
              e.currentTarget.style.opacity = "0";
            }}
          />
        </div>
      </div>

      {/* เล็ก-กลางขวาสุด */}
      <div className="relative pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center -translate-y-[180px] -translate-x-[-770px] pointer-events-auto">
          <img
            src={RING_IMG_URL}
            className="h-[125px] w-[125px] object-contain select-none pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={pokemonSpriteUrl(ids[11])}
            className="absolute h-[100px] w-[100px] object-contain select-none cursor-pointer transition-transform"
            alt={`pokemon-${ids[11]}`}
            onClick={() => goToDetail(ids[11])}
            onError={(e) => {
              e.currentTarget.style.opacity = "0";
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default RandomPokemonBalls;