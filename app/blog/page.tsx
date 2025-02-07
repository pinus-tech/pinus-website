"use client"
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TitleHeader } from "../components/ui/title";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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

interface Blog {
  id: string;
  title: string;
  description: string;
  date: string;
  categories: string[];
  author: string;
  thumbnail: {
    url: string;
  } | null;
}

async function getBlogs(): Promise<Blog[]> {
  const res = await fetch("/api/blogs", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch blogs");
  }
  return res.json();
}

function BlogListContent() {
  const [selected, setSelected] = useState<string>("");
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const blogsPerPage = 6;  // You can adjust this number to control how many blogs per page
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryType = searchParams.get("type");

  useEffect(() => {
    if (queryType) {
      setSelected(queryType);
    }
  }, [queryType]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selected]);
  
  useEffect(() => {
    router.push(`?type=${selected}`);
  }, [selected, router]);

  useEffect(() => {
    getBlogs()
      .then(setBlogs)
      .catch((error) => console.error("Error fetching blogs:", error));
  }, []);

  // Filter blogs based on selected category
  const filteredBlogs = selected === "all" || !selected
    ? blogs
    : blogs.filter((blog) => blog.categories.includes(selected));

  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);
  const currentBlogs = filteredBlogs.slice((currentPage - 1) * blogsPerPage, currentPage * blogsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const generatePagination = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 5) {
      // If the total pages are 5 or fewer, just show all the pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show the first page if it's not the current page
      if (currentPage > 2) pages.push(1);
  
      // Show ellipsis if current page is far from the first page
      if (currentPage > 2) pages.push("...");
  
      // Show the previous and next page numbers
      if (currentPage > 1) pages.push(currentPage - 1);
      pages.push(currentPage);
      if (currentPage < totalPages) pages.push(currentPage + 1);
  
      // Show ellipsis if current page is far from the last page
      if (currentPage < totalPages - 1) pages.push("...");
  
      // Always show the last page if it's not the current page
      if (currentPage < totalPages - 1) pages.push(totalPages);
    }
  
    return pages;
  };
  

  return (
    <>
      <div className="flex justify-center items-center">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-64 font-bold">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectLabel>Events</SelectLabel>
              <SelectItem value="Orientation">Orientation</SelectItem>
              <SelectItem value="Sharing Session">Sharing Session</SelectItem>
              <SelectLabel>Committee</SelectLabel>
              <SelectItem value="Welfare">Welfare</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-auto">      
        {currentBlogs
          .filter((blog) => !selected || selected == "all" || blog.categories.includes(selected))
          .map((blog) => (
            <Card key={blog.id} className="overflow-hidden shadow-md flex flex-col h-full">
              <CardImage
                width={400}
                height={250}
                src={blog.thumbnail || "/blue.png"}
                alt={blog.title}
                className="w-full object-cover"
                />
              <CardHeader>
                <CardTitle>{blog.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>By {blog.author} on {blog.date}</CardDescription>
              </CardContent>
              <CardContent>
                <CardDescription>{blog.description}</CardDescription>
              </CardContent>
              <CardFooter>
                <CardTags eventType={blog.categories.join(', ')} />
              </CardFooter>
            </Card>
          ))}
      </div>

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
            className={`text-blue-500 text-lg ${page === currentPage ? "text-darkblue font-semibold" : "hover:text-darkblue"}`}
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
    </>
  );
}

export default function BlogList() {
  return (
<main className="w-full max-w-4xl mx-auto px-8 py-10 flex flex-col gap-8">
<TitleHeader text="Blog" color="blue" />
      <Suspense fallback={<div>Loading...</div>}>
        <BlogListContent />
      </Suspense>
    </main>
  );
}
