import logo from "../assets/logo.svg";
import GithubIcon from "../assets/github.svg";
import { BoxArrowUpIcon } from "@phosphor-icons/react";

export const Header = () => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-green-500 p-2 rounded">
          <BoxArrowUpIcon className="w-6 h-6" weight="bold" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold mb-0 leading-none">FileDump</h1>

          <p className="text-gray-400 leading-none text-xs mt-1">
            A stupid simple file server.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <a href="/docs" className="p-1 text-sm rounded border-gray-600">
          docs
        </a>
        <a
          href="https://github.com/jordykoppen/file-dump"
          className="p-2 text-white text-sm flex gap-2 items-center rounded border-gray-600"
        >
          <img src={GithubIcon} alt="GitHub Logo" className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
};
