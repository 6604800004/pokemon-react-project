import { type StatBarProps } from "../data/pokemonData";

// ค่าพลัง
const Max_Status = 265;
// จำนวนหลอดค่าพลัง
const Total_Segments = 15;

// แปลงค่าพลังเป็นจำนวนช่อง status
function getFilledSegments(baseStat: number): number {
  const ratio = Math.min(baseStat / Max_Status, 1);
  return Math.round(ratio * Total_Segments);
}

function StatBar({ label, value }: StatBarProps) {
  const filledSegments = getFilledSegments(value);

  return (
    <div className="flex flex-col items-center ">
      <div className="flex flex-col-reverse gap-[3px] w-full h-[190px] bg-[#0a141e]">
        {Array.from({ length: Total_Segments }).map((_, i) => (
          <div
            key={i}
            className={
              i < filledSegments
                ? "flex-1 bg-[#5ec8f0] border border-[#b3eafe] [filter:drop-shadow(0_0_2px_#ffffff)]"
                : "flex-1 bg-transparent border border-[#466e9b]"
            }
          />
        ))}
      </div>
      <span className="mt-1 text-[14px] text-white text-center ">{label}</span>
    </div>
  );
}

export default StatBar;
