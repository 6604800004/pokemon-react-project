import { useNavigate } from "react-router";

function NotFound() {
  const nav = useNavigate();

  return (
    <div className="notfound-dots relative min-h-screen flex flex-col items-center justify-center bg-[#f5f5f5] overflow-hidden">
      <div className="relative z-10 bg-white border-4 border-[#171717] rounded-3xl px-8 py-10 max-w-sm w-full shadow-[0_10px_0_rgba(0,0,0,0.15)]">
        <h1 className="text-[6rem] text-black text-center m-0 mb-4">404</h1>
        <p className="text-base text-[#262626] mb-8 leading-relaxed">
          ดูเหมือนว่าหน้านี้หลบหนีเข้าป่าไปแล้ว...
          <br />
          ลองกลับไปจับมันใหม่ที่หน้าแรกดูสิ
        </p>

        <button
          onClick={() => nav("/")}
          className="mx-auto flex items-center justify-center bg-[#171717] text-white font-extrabold text-base rounded-full px-8 py-3 cursor-pointer border-0 transition-colors hover:bg-[#333]"
        >
          กลับไปหน้าแรก
        </button>
      </div>
    </div>
  );
}

export default NotFound;