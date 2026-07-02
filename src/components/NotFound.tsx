import { useNavigate } from "react-router";
<<<<<<< HEAD
=======
import "../css/App.css";
>>>>>>> 249c5404214499b0073e0952a44f2d14a6185aca

function NotFound() {
  const nav = useNavigate();

  return (
<<<<<<< HEAD
    <div className="notfound-dots relative min-h-screen flex flex-col items-center justify-center bg-[#f5f5f5] overflow-hidden">
      <div className="relative z-10 bg-white border-4 border-[#171717] rounded-3xl px-8 py-10 max-w-sm w-full shadow-[0_10px_0_rgba(0,0,0,0.15)]">
        <h1 className="text-[6rem] text-black text-center m-0 mb-4">404</h1>
        <p className="text-base text-[#262626] mb-8 leading-relaxed">
=======
    <div className="notfound-page">
      <div className="notfound-card">
        <h1 className="notfound-title">404</h1>
        <p className="notfound-note-text">
>>>>>>> 249c5404214499b0073e0952a44f2d14a6185aca
          ดูเหมือนว่าหน้านี้หลบหนีเข้าป่าไปแล้ว...
          <br />
          ลองกลับไปจับมันใหม่ที่หน้าแรกดูสิ
        </p>

<<<<<<< HEAD
        <button
          onClick={() => nav("/")}
          className="pokeball-btn flex flex-col items-center gap-3 mx-auto bg-transparent border-0 cursor-pointer p-0"
        >
          <span className="pokeball-ball flex items-center justify-center w-24 h-24 rounded-full border-4 border-[#171717]">
            <span className="pokeball-center w-8 h-8 rounded-full bg-white border-4 border-[#171717]" />
          </span>
          <span className="font-extrabold text-[#171717] text-base">
            กลับไปหน้าแรก
          </span>
=======
        <button className="pokeball-button" onClick={() => nav("/")}>
          <span className="pokeball-button__ball">
            <span className="pokeball-button__center" />
          </span>
          <span className="pokeball-button__label">กลับไปหน้าแรก</span>
>>>>>>> 249c5404214499b0073e0952a44f2d14a6185aca
        </button>
      </div>
    </div>
  );
}

export default NotFound;