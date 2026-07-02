import { useState, useEffect } from "react";
import { useNavigate, useParams } from 'react-router';
<<<<<<< HEAD


function PokemonDetail() {
    const nav = useNavigate();
    const [data, setData] = useState<any>(null);
=======
import { type Tdata } from "../data/pokemonData";
import "../css/App-Detail.css"

function PokemonDetail() {
    const nav = useNavigate();
    const [data, setData] = useState<Tdata | null>(null);
>>>>>>> 249c5404214499b0073e0952a44f2d14a6185aca
    const { id } = useParams();

    useEffect(() => {
        if (!id) {
            nav("/404", { replace: true });
            return;
        }
        let cancelled = false;
        const fetchData = async () => {
            try {
                const numericId = parseInt(id, 10);
<<<<<<< HEAD
                const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${numericId}`);
=======
                const res = await fetch(`https://pokeapi.co/api/v2/pokemon-form/${numericId}`);
>>>>>>> 249c5404214499b0073e0952a44f2d14a6185aca
                if (!res.ok) {
                    if (!cancelled) nav("/404", { replace: true });
                    return;
                }
                const json = await res.json();
                if (!cancelled) setData(json);
            } catch (err) {
                if (!cancelled) nav("/404", { replace: true });
            }
        };
        fetchData();
        return () => { cancelled = true; };
    }, [id, nav]);

<<<<<<< HEAD
    if (!data) return null;

=======
>>>>>>> 249c5404214499b0073e0952a44f2d14a6185aca
    return (
        <>
            <div className="header">
                <div className="logo__" />
            </div>

            <div className="pokemon-detail-contents">
                <div className="pokedex-detail__header">
                    <a className="pokemon-detail__header__back-to-top" onClick={() => nav(-1)}>
                        โปเกเด็กซ์
                    </a>
                </div>
<<<<<<< HEAD

                <div className="pokemon-detail-box">
                    <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`}
                        alt={data.name}
                    />
                    <h2>{data.name}</h2>
                    <div className="pokemon-detail__types">
                        {data.types.map((t: { type: { name: string } }) => (
                            <span key={t.type.name} className={`type type--${t.type.name}`}>
                                {t.type.name}
                            </span>
                        ))}
                    </div>
                </div>
=======
>>>>>>> 249c5404214499b0073e0952a44f2d14a6185aca
            </div>
        </>
    );
}

export default PokemonDetail;