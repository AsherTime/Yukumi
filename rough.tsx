export default function Home() {
  const [favorites, setFavorites] = useState<number[]>([])
  const toggleFavorite = (id: number) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]))
  }

  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return " ";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  useEffect(() => {
      const fetchAnime = async () => {
        try {
          const response = await fetch("https://x8ki-letl-twmt.n7.xano.io/api:8BJgb0Hk/animes1"); // 🔹 Replace with Xano API URL
          const data = await response.json();
          console.log("Anime Data:", data); // ✅ Debugging
  
          setAnimeList(data.sort((a: Anime, b: Anime) => a.id - b.id)); // Update state with API data
          setLoading(false);
        } catch (error) {
          console.error("Error fetching anime:", error);
          setLoading(false);
        }
      };
  
      fetchAnime();
    }, []);
  
    if (loading) return <p>Loading anime...</p>;