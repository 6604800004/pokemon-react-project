import { type StatBarProps } from "../data/pokemonData";

const Max_Status = 255; // ค่าพลังสูงสุดที่เป็นไปได้ ใช้เทียบสัดส่วน
const Total_Segments = 15; // แบ่งแถบพลังออกเป็น 15 ช่อง

// คำนวณว่าจากค่าพลังจริง ต้องติดสีกี่ช่องจากทั้งหมด Total_Segments
function getFilledSegments(baseStat: number): number {
  const ratio = Math.min(baseStat / Max_Status, 1); // สัดส่วน 0-1 กันไม่ให้เกิน 1
  return Math.ceil(ratio * Total_Segments); // ปัดขึ้น ค่าพลังน้อยจะได้เห็นช่องติดสีอย่างน้อย 1 ช่อง
}

function StatBar({ value, name }: StatBarProps) {
  const filledSegments = getFilledSegments(value); // จำนวนช่องที่ติดสี ที่เหลือเป็นช่องว่าง

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
      <span className="mt-1 text-[14px] text-white text-center ">{name}</span>
    </div>
  );
}

export default StatBar;
