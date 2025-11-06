import "./index.css";
import { useState, useCallback } from "react";
import { BunStoreFile } from "./schemas";
import { useDebounce } from "./hooks/useDebounce";
import { FileDialog } from "./components/FileDialog";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Toolbar } from "./components/Toolbar";
import { FileList } from "./components/FileList";
import { useQuery } from "@tanstack/react-query";

const getFiles = () =>
  fetch("/api/files").then<BunStoreFile[]>((res) => res.json());

export function App() {
  const { data } = useQuery({
    queryKey: ["files"],
    queryFn: getFiles,
  });

  const [searchItems, setSearchItems] = useState<BunStoreFile[]>();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string>();

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);

    if (event.target.value.length > 0) {
      debouncedFilterItems(event.target.value);
    } else if (event.target.value.length === 0) {
      setSearchItems(undefined);
    }
  };

  const handleResetSearch = () => {
    setSearchQuery("");
    setSearchItems(undefined);
  };

  const filterItems = useCallback(
    (query: string) => {
      if (!data) return [];
      const filteredItems = data.filter(
        ({ name, hash, mimeType }: BunStoreFile) =>
          [name, hash, mimeType]
            .map((field) => field.toLowerCase())
            .some((field) => field.includes(query.toLowerCase()))
      );
      setSearchItems(filteredItems);
    },
    [data]
  );

  const debouncedFilterItems = useDebounce(filterItems, 200);

  if (!data) {
    return null;
  }

  const footer =
    searchQuery.length > 0 && searchItems?.length === 0
      ? "No results found"
      : searchItems
      ? `${searchItems.length} found`
      : `${data.length} file${data.length !== 1 ? "s" : ""} stored`;

  const selectedFile = data.find((file) => file.hash === selectedId);

  return (
    <div className="p-8 max-w-2xl mx-auto grid gap-4 max-h-screen grid-rows-[auto_auto_1fr_auto_auto]">
      <Header />

      <Toolbar
        searchQuery={searchQuery}
        handleSearch={handleSearch}
        handleResetSearch={handleResetSearch}
      />

      <FileList
        files={searchItems ?? data}
        setSelectedId={setSelectedId}
        footer={footer}
      />

      <Footer />

      {selectedFile && (
        <FileDialog
          file={selectedFile}
          onClose={setSelectedId.bind(null, undefined)}
        />
      )}
    </div>
  );
}

export default App;
