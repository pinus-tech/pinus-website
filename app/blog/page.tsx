"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TitleHeader } from "../components/ui/title";
import { BlurFade } from "../components/ui/blur-fade";
import { Suspense } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  CardContent,
  CardImage,
  CardTags,
} from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";

const BLUR_FADE_DELAY = 0.04;

interface Blog {
  id: string;
  url: string;
  title: string;
  description: string;
  date: string;
  categories: string[];
  author: string;
  thumbnail: string;
}

async function getBlogs(): Promise<Blog[]> {
  const res = await fetch("/api/blogs", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch blogs");
  return res.json();
}

const trimNotionURL = (url: string) => {
  const splitURL = url.split("/");
  return splitURL[splitURL.length - 1];
};

function BlogListContent() {
  const [selected, setSelected] = useState<string>("");
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const blogsPerPage = 6;
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryType = searchParams.get("type");
  const [tagOptions, setTagOptions] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/blog-tags")
      .then((res) => res.json())
      .then(setTagOptions)
      .catch((err) => console.error("Failed to load tags", err));
  }, []);
  
  useEffect(() => {
    if (queryType) setSelected(queryType);
  }, [queryType]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selected]);

  useEffect(() => {
    router.push(`?type=${selected}`);
  }, [selected, router]);

  useEffect(() => {
    setLoading(true);
    getBlogs()
      .then(setBlogs)
      .catch((error) => console.error("Error fetching blogs:", error))
      .finally(() => setLoading(false));
  }, []);

  const filteredBlogs =
    selected === "all" || !selected
      ? blogs
      : blogs.filter((blog) => blog.categories.includes(selected));

  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);
  const currentBlogs = filteredBlogs.slice(
    (currentPage - 1) * blogsPerPage,
    currentPage * blogsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const generatePagination = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage > 2) pages.push(1);
      if (currentPage > 2) pages.push("...");
      if (currentPage > 1) pages.push(currentPage - 1);
      pages.push(currentPage);
      if (currentPage < totalPages) pages.push(currentPage + 1);
      if (currentPage < totalPages - 1) pages.push("...");
      if (currentPage < totalPages - 1) pages.push(totalPages);
    }

    return pages;
  };

  return (
    <>
      {/* Category Filter */}
      <div className="flex justify-center items-center">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-64 font-bold">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Categories</SelectItem>
              {tagOptions.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
  
      {/* Blog Content */}
      {loading ? (
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 px-4 sm:px-0 justify-items-center">
            {[...Array(6)].map((_, index) => (
              <BlurFade
                delay={BLUR_FADE_DELAY * (index + 1.5)}
                key={index}
                className="flex flex-col h-full max-w-xs w-full"
                inView
              >
                <Skeleton className="rounded-xl h-48 w-full" />
                <Skeleton className="mt-4 h-6 w-3/4" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
                <Skeleton className="mt-4 h-6 w-1/4" />
              </BlurFade>
            ))}
          </div>
        </div>
      ) : currentBlogs.length === 0 ? (
        <BlurFade delay={BLUR_FADE_DELAY * 1} inView>
          <div className="col-span-full flex justify-center items-center h-40 text-gray-500 text-center">
            No blog posts found.
          </div>
        </BlurFade>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 px-4 sm:px-0 justify-items-center">
          {currentBlogs.map((blog, index) => (
            <BlurFade
              delay={BLUR_FADE_DELAY * (index + 1.5)}
              key={blog.id}
              className="flex flex-col h-full max-w-xs w-full"
              inView
            >
              <Link
                href={`/blog/${trimNotionURL(blog.url)}`}
                className="max-w-xs w-full mx-auto"
              >
                <Card className="overflow-hidden shadow-md flex flex-col h-full min-h-[420px]">
                  <CardImage
                    width={400}
                    height={250}
                    src={blog.thumbnail || "/blue.png"}
                    alt={blog.title}
                    className="w-full h-48 object-cover"
                  />
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">
                      {blog.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <CardDescription className="text-sm text-gray-600">
                      By {blog.author} on {blog.date}
                    </CardDescription>
                    <p className="mt-2 text-sm line-clamp-3 text-gray-800">
                      {blog.description}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <CardTags
                      teamName=""
                      eventType={blog.categories.join(", ")}
                    />
                  </CardFooter>
                </Card>
              </Link>
            </BlurFade>
          ))}
        </div>
      )}
  
      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center space-x-4">
          {currentPage > 1 && (
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              className="text-blue-500 text-lg hover:text-darkblue transition-colors"
            >
              Prev
            </button>
          )}
          {generatePagination().map((page, index) => (
            <button
              key={index}
              onClick={() => page !== "..." && handlePageChange(Number(page))}
              className={`text-blue-500 text-lg ${
                page === currentPage
                  ? "text-darkblue font-semibold"
                  : "hover:text-darkblue"
              }`}
              disabled={page === "..." || page === currentPage}
            >
              {page}
            </button>
          ))}
          {currentPage < totalPages && (
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              className="text-blue-500 text-lg hover:text-darkblue transition-colors"
            >
              Next
            </button>
          )}
        </div>
      )}
    </>
  );
  
}

export default function BlogList() {
  return (
    <div className="flex flex-col gap-8 items-center min-h-screen">
      <div className="w-full h-[25vh] md:h-[35vh] lg:h-[50vh]">
        <img
          src="/test_img2.png"
          alt="PINUS Committee Image"
          className="w-full h-full object-cover object-center"
        />
      </div>
      <main className="w-full max-w-4xl mx-auto px-8 py-10 flex flex-col gap-8">
        <TitleHeader text="Blog" color="blue" />
        <Suspense fallback={<div>Loading...</div>}>
          <BlogListContent />
        </Suspense>    
      </main>
    </div>
  );
}
