"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  return (
    <div className="sticky top-0 z-20 bg-white shadow-sm">
      <Tabs value={activeCategory} onValueChange={onCategoryChange} className="w-full">
        <TabsList className="w-full justify-start gap-2 h-auto p-2 bg-white overflow-x-auto flex-nowrap">
          {categories.map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="px-4 py-2 rounded-full data-[state=active]:bg-[#2d9da1] data-[state=active]:text-white text-sm whitespace-nowrap border border-gray-200"
            >
              {category === "BEBIDAS" && "🍺 "}
              {category === "PORÇÕES" && "🍤 "}
              {category === "COMBOS" && "🎁 "}
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
