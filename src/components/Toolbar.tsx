import {
  MagnifyingGlassIcon,
  UploadSimpleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

const postFile = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return fetch("/api/file", {
    method: "POST",
    body: formData,
  });
};

export const Toolbar = ({
  searchQuery,
  handleSearch,
  handleResetSearch,
}: {
  searchQuery: string;
  handleSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleResetSearch: () => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: postFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.item(0);

    if (!file) return;

    mutation.mutate(file);
  };

  return (
    <div className="flex gap-4">
      <div className="relative w-full">
        <MagnifyingGlassIcon className="absolute left-2 top-1/2 transform -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search files..."
          className="w-full border border-gray-600 text-sm rounded-md p-1 px-8 text-gray-400"
          value={searchQuery}
          onChange={handleSearch}
        />
        {searchQuery.length > 0 && (
          <button onClick={handleResetSearch}>
            <XIcon className="absolute right-2 top-1/2 transform -translate-y-1/2" />
          </button>
        )}
      </div>
      <input
        type="file"
        name="file"
        className="ml-4 hidden"
        ref={fileInputRef}
        onChange={handleUpload}
      />
      <button
        className="flex items-center gap-2 px-4 py-1 text-sm rounded-sm border-gray-600 border"
        onClick={handleUploadClick}
      >
        <UploadSimpleIcon />
        upload
      </button>
    </div>
  );
};
