import { createBrowserRouter, RouterProvider, Navigate} from "react-router";
import NotFound from './components/NotFound';
import PokemonList from "./components/PokemonList"
import PokemonDetail from "./components/PokemonDetail";

// กำหนดเส้นทางทั้งหมดของแอป
const router = createBrowserRouter([
  { path: "/", element: < Navigate to="/PokeDex" replace />}, // เข้าหน้าแรกให้เด้งไปหน้ารายการโปเกมอนทันที
  { path: "/PokeDex", element: <PokemonList /> }, // หน้ารายการโปเกมอนทั้งหมด
  { path: "/PokeDex/:id", element: <PokemonDetail /> }, // หน้ารายละเอียดโปเกมอนตาม id หรือชื่อ
  { path: "*", element: <NotFound /> } // path ที่ไม่ตรงกับเส้นทางไหนเลย
]);

function App() {
  return <RouterProvider router={router} />;
}
export default App;