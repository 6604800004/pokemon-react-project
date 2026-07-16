import { type StatBarProps } from "../data/pokemonData";

const Max_Status = 220; //ค่าพลังสูงสุด
const Total_Segments = 15; //จำนวนหลอด status

function getFilledSegments(baseStat: number): number {
  const ratio = Math.min(baseStat / Max_Status, 1);
  return Math.round(ratio * Total_Segments);
}

function StatBar({ label, value }: StatBarProps) {
  const filledSegments = getFilledSegments(value);

  return (
    <div className="flex flex-col items-center ">
      <div className="flex flex-col-reverse gap-[4px] w-full h-[190px] ">
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
      <span className="mt-2 text-[14px] text-white text-center ">{label}</span>
    </div>
  );
}

export default StatBar;