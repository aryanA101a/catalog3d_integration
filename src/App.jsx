import React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IoIosArrowBack } from "react-icons/io";
import { Slider } from "@/components/ui/slider";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const App = () => {
  const [catalog, setCatalog] = useState({});
  const [catalogStack, setCatalogStack] = useState([]);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({});
  const [viewProducts, toggleViewProducts] = useState(false);
  const pushToCatalogStack = (item) => {
    setCatalogStack((prevStack) => [...prevStack, item]);
  };

  const popFromCatalogStack = () => {
    setCatalogStack((prevStack) => {
      const newStack = [...prevStack];
      newStack.pop();
      return newStack;
    });
  };
  const fetchCatalog = async () => {
    try {
      console.log(import.meta.env.VITE_API_URL);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/v1/catalog`);
      const data = await res.json();
      console.log(data);
      setCatalog(data.data.catalog);
      pushToCatalogStack("root");
    } catch (error) {
      console.log("Error fetching data", error);
    }
  };
  const fetchProducts = async (categoryId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/v1/products/${categoryId}`
      );
      const data = await res.json();
      console.log(data);
      setProducts(data.data);
    } catch (error) {
      console.log("Error fetching data", error);
    }
  };
  const fetchFilters = async (categoryId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/v1/filters/${categoryId}`
      );
      const data = await res.json();
      console.log(data);
      setFilters(data);
    } catch (error) {
      console.log("Error fetching data", error);
    }
  };
  useEffect(() => {
    fetchCatalog();
  }, []);
  return (
    <div className="h-screen m-4 grid gap-4 sm:grid-cols-12">
      <div className="h-screen rounded-lg bg-gray-100 sm:col-span-4">
        <div className="flex w-full max-w-sm items-center space-x-2 m-6">
          <Button
            onClick={() => {
              if (catalogStack.length > 1) {
                popFromCatalogStack();
              }
              if (viewProducts) {
                toggleViewProducts(!viewProducts);
                setProducts([]);
                setFilters({});
              }
            }}
            type="submit"
          >
            <IoIosArrowBack />
          </Button>
          <Input placeholder="Search" />
        </div>
        <div className="m-6">
          <Breadcrumb className="h-10">
            <BreadcrumbList>
              {catalogStack.map((categoryName, index) => (
                <>
                  {index > 0 ? <BreadcrumbSeparator /> : null}
                  <BreadcrumbItem>
                    {categoryName == "root"
                      ? "Catalog"
                      : categoryName.charAt(0).toUpperCase() +
                        categoryName.slice(1)}
                  </BreadcrumbItem>
                </>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          <div
            className={`grid gap-2 sm:grid-cols-3 ${
              Object.keys(filters).length > 0 ? "m-4" : ""
            }`}
          >
            {Object.keys(filters).length > 0
              ? filters.filterCriterias.map((criteria) => (
                  <DropdownMenu className="border-black ">
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="rounded-full font-bold"
                      >
                        {criteria.name}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {criteria.name == "price" ? (
                        <div className="flex w-40 max-w-sm items-center space-x-2 m-3">
                          <p>${Math.min(...criteria.values.map(Number))}</p>
                          <Slider className="" defaultValue={[33]} max={100} step={1} />
                          <p>${Math.max(...criteria.values.map(Number))}</p>

                        </div>
                        
                      ) : (
                        criteria.values.map((value) => (
                          <DropdownMenuLabel>{value}</DropdownMenuLabel>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ))
              : null}
          </div>
          <div className="grid  gap-2 sm:grid-cols-3">
            {catalogStack.length > 0
              ? viewProducts
                ? products.length > 0
                  ? products.map((product) => (
                      <div className="h-[230px] max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                        <img
                          className="rounded-t-lg"
                          src={product.thumbnail}
                          alt=""
                        />
                        <div className="p-5">
                          <h5 className="mb-2  font-bold tracking-tight text-gray-900 dark:text-white line-clamp-3">
                            {product.name}
                          </h5>
                        </div>
                      </div>
                    ))
                  : null
                : catalog[
                    catalogStack[catalogStack.length - 1]
                  ].subcategories.map((category, index) => (
                    <Button
                      onClick={() => {
                        if (catalog[category.name]) {
                          pushToCatalogStack(category.name);
                        } else {
                          pushToCatalogStack(category.name);
                          fetchProducts(category.id);
                          fetchFilters(category.id);
                          toggleViewProducts(true);
                        }
                        console.log();
                      }}
                      key={index}
                      type="submit"
                      className="hover:bg-red-200 bg-red-100 font-bold text-red-500"
                    >
                      {category.name.charAt(0).toUpperCase() +
                        category.name.slice(1)}
                    </Button>
                  ))
              : null}
          </div>

          {/* <div className="bg-slate-200 rounded-lg h-26">
            <img
              className="h-10"
              src="https://reactjs.org/logo-og.png"
              alt="React Image"
            />
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default App;
