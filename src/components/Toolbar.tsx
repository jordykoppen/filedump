import {
  MagnifyingGlassIcon,
  UploadSimpleIcon,
  XIcon,
  CircleNotchIcon,
} from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

const postFile = async (file: File) => {
  const response = await fetch("/api/file", {
    method: "POST",
    body: file,
    headers: {
      "X-Filename": file.name,
      "Content-Type": file.type || "application/octet-stream",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `Upload failed with status ${response.status}`
    );
  }

  return response;
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
    onError: (error) => {
      console.error("Upload failed:", error);
      alert("Failed to upload file. Please try again.");
    },
  });

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.item(0);

    if (!file) return;

    mutation.mutate(file);

    // Reset input to allow re-uploading the same file
    event.target.value = "";
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
        className="flex items-center gap-2 px-4 py-1 text-sm rounded-sm border-gray-600 border disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleUploadClick}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <>
            <CircleNotchIcon className="animate-spin" />
            uploading...
          </>
        ) : (
          <>
            <UploadSimpleIcon />
            upload
          </>
        )}
      </button>
    </div>
  );
};
