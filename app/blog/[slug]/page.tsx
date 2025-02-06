import Button from "@/app/components/ui/button";
import TitleHeader from "@/app/components/ui/title";
import styles from "@/app/styles.module.css";

export const runtime = "edge";

// This is blog list page and should be done by Team Ella
// Todo: Slicing the design and need to create functionallity to fetch the data from the notion database and render the data on this page. For this one need to read the parameter from the URL and fetch the data based on the parameter. Good Luck!
import Image from "next/image";

const BlogContent = () => {
  return (
    <article className="max-w-3xl w-full bg-white p-6 sm:p-10 rounded-2xl shadow-lg text-gray-800">
      {/* Metadata Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 text-gray-500 text-sm">
        <span>📅 February 6, 2025</span>
        <span>⏳ 5 min read</span>
        <span className="text-blue-600 font-semibold">#Community</span>
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Pinus Bonding 2024</h2>

      {/* Blog Content */}
      <p className="text-lg leading-relaxed mb-4">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam vel 
        lectus vitae odio gravida fermentum a at sapien. Morbi tristique sapien 
        sit amet erat convallis, nec laoreet erat imperdiet.
      </p>
      <p className="text-lg leading-relaxed mb-4">
        Vestibulum tincidunt, quam ut varius pulvinar, eros odio placerat nulla, 
        nec dictum augue odio at lacus. Fusce id turpis vitae neque aliquet dapibus 
        ac id ex. Integer ac risus ut dolor efficitur sodales in eu metus.
      </p>
      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 mb-4">
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis vehicula 
        mauris ut erat tincidunt pharetra."
      </blockquote>
      <p className="text-lg leading-relaxed">
        Nam sed magna et lorem venenatis dictum. Suspendisse potenti. Duis aliquam 
        diam ut fermentum egestas. Donec suscipit, urna et congue bibendum, 
        tortor metus dignissim justo, nec tristique nisi ligula nec arcu.
      </p>

      {/* Author Section */}
      <div className="flex items-center gap-4 mt-8 border-t pt-4">
        <img
          src="/author.jpg" 
          alt="Author"
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <h4 className="text-md font-semibold text-gray-900">Fufufafa</h4>
          <p className="text-sm text-gray-500">Ganyang</p>
        </div>
      </div>
    </article>
  );
};

export default function BlogDetail() {
  return (    
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start min-h-screen">
      <div className="relative w-full h-auto">
        {/* Gradient overlay div */}
        <div className={styles.titleImageGradient}></div>
        
        {/* Image div with background */}
        <div className="relative z-0">
          <picture>
            <source media="(max-width: 768px)" srcSet="/hero_mobile.png" />
            <img alt="" src="/hero_desktop.png" className={styles.coverImage} />
          </picture>
        </div>

        {/* Title text on top of image */}
        <div className="absolute top-3/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
          text-white text-3xl sm:text-5xl font-bold z-10 text-center drop-shadow-[0_4px_6px_rgba(0,0,0,0.7)]">
          Pinus Bonding 2024
        </div>

        <div className={styles.coverText}>Indonesia</div>
      </div>

      <div className="w-full flex justify-center mb-4">
        <BlogContent />
      </div>
    </main>   
  );
}
