import { createBrowserRouter, RouterProvider, Navigate} from "react-router";
import NotFound from './components/NotFound';
import PokemonList from "./components/PokemonList"
import PokemonDetail from "./components/PokemonDetail";
<<<<<<< HEAD
=======
import "./css/App.css";
>>>>>>> 249c5404214499b0073e0952a44f2d14a6185aca

const router = createBrowserRouter([
  { path: "/", element: < Navigate to="/PokeDex" replace />},
  { path: "/PokeDex", element: <PokemonList /> },
  { path: "/PokeDex/:id", element: <PokemonDetail /> },
  { path: "*", element: <NotFound /> }
]);

function App() {
  return <RouterProvider router={router} />;
}
export default App;
