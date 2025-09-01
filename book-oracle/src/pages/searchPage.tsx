import { useState, useEffect, useCallback } from "react";
import { apiService } from "@/services/api";
import { Book } from "@/types/api";
import BookCard from "@/components/BookCard";
import debounce from "lodash.debounce";

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBooks = async (search: string) => {
    if (!search) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiService.searchBooks({ q: search });
      setResults(res);
    } catch (error) {
      console.error("Failed to fetch search results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce the search function
  const debouncedSearch = useCallback(debounce(fetchBooks, 300), []);

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  return (
    <div className="container mx-auto p-4">
      <input
        type="text"
        className="w-full border rounded-md p-2 mb-4"
        placeholder="Search books by title, author, or genre..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {isLoading && <p>Loading...</p>}

      {!isLoading && results.length === 0 && query && <p>No results found.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {results.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
};

export default SearchPage;
