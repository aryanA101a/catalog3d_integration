import React, { useRef } from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IoIosArrowBack } from "react-icons/io";
import { IoIosCheckmark } from "react-icons/io";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
  const [filtersToBeApplied, setFiltersToBeApplied] = useState({});
  const slidersState = {};

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
      setCatalog((prev) => {
        return { ...prev, ...data.data.catalog };
      });
      pushToCatalogStack({ id: -1, name: "root" });
    } catch (error) {
      console.log("Error fetching data", error);
    }
  };
  const fetchProducts = async (categoryId, body) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/v1/products/${categoryId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      console.log(data);
      return data.products;
    } catch (error) {
      console.log("Error fetching data", error);
      return [];
    }
  };
  const fetchFilters = async (categoryId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/v1/products/${categoryId}/filters`
      );
      const data = await res.json();
      console.log(data);
      setFilters(data);
      setFiltersToBeApplied(initFiltersToBeApplied(data));
      // console.log("filtersToBeApplied", filtersToBeApplied);
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
              if (products && products.length) {
                setProducts([]);
                setFilters({});
                setFiltersToBeApplied({});
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
              {catalogStack.map((category, index) => (
                <>
                  {index > 0 ? <BreadcrumbSeparator /> : null}
                  <BreadcrumbItem>
                    {category.name == "root"
                      ? "Catalog"
                      : category.name.charAt(0).toUpperCase() +
                        category.name.slice(1)}
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
            {filters.sortCriteria ? (
              <DropdownMenu
                className="border-black "
                onOpenChange={(v) => {
                  if (!v) {
                    fetchProducts(catalogStack[catalogStack.length - 1].id, {
                      filterCriteria: Object.values(
                        filtersToBeApplied.filterCriteria
                      ).filter((e) => e.values.length || e.values.min),
                      sortCriteria: Object.keys(filtersToBeApplied.sortCriteria)
                        .length
                        ? filtersToBeApplied.sortCriteria
                        : null,
                    }).then((res) => {
                      setProducts(res ?? []);
                      console.log("res", res);
                    });
                  }
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full font-bold">
                    sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {filters.sortCriteria.map((value) => (
                    <>
                      <DropdownMenuLabel className="flex items-center justify-between m-2">
                        <DropdownMenuCheckboxItem
                          checked={
                            filtersToBeApplied.sortCriteria.name == value &&
                            filtersToBeApplied.sortCriteria.order == "asc"
                          }
                          onCheckedChange={(v) => {
                            setFiltersToBeApplied((prev) => {
                              return {
                                ...prev,
                                ...modifySortCriterionToBeApplied(
                                  value,
                                  "asc",
                                  filtersToBeApplied
                                ),
                              };
                            });
                          }}
                        >
                          {value}
                          &nbsp;&nbsp;&nbsp;&nbsp;(inc)&nbsp;&nbsp;&nbsp;&nbsp;
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuLabel>
                      <DropdownMenuLabel className="flex items-center justify-between m-2">
                        <DropdownMenuCheckboxItem
                          checked={
                            filtersToBeApplied.sortCriteria.name == value &&
                            filtersToBeApplied.sortCriteria.order == "desc"
                          }
                          onCheckedChange={(v) => {
                            setFiltersToBeApplied((prev) => {
                              return {
                                ...prev,
                                ...modifySortCriterionToBeApplied(
                                  value,
                                  "desc",
                                  filtersToBeApplied
                                ),
                              };
                            });
                          }}
                        >
                          {value}
                          &nbsp;&nbsp;&nbsp;&nbsp;(dec)&nbsp;&nbsp;&nbsp;&nbsp;
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuLabel>
                    </>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            {Object.keys(filters).length > 0
              ? filters.filterCriteria.map((criteria) => (
                  <DropdownMenu
                    className="border-black "
                    onOpenChange={(v) => {
                      if (!v) {
                        fetchProducts(
                          catalogStack[catalogStack.length - 1].id,
                          {
                            filterCriteria: Object.values(
                              filtersToBeApplied.filterCriteria
                            ).filter((e) => e.values.length || e.values.min),
                            sortCriteria: filtersToBeApplied.sortCriteria,
                          }
                        ).then((res) => {
                          setProducts(res ?? []);
                          console.log("res", res);
                        });
                      }
                    }}
                  >
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
                        <div className="w-40 m-4">
                          <Slider
                            className=""
                            minStepsBetweenThumbs={1}
                            defaultValue={[
                              Math.min(...criteria.values.map(Number)),
                              Math.max(...criteria.values.map(Number)),
                            ]}
                            max={Math.max(...criteria.values.map(Number))}
                            min={Math.min(...criteria.values.map(Number))}
                            value={[
                              filtersToBeApplied.filterCriteria[criteria.name]
                                .values.min,
                              filtersToBeApplied.filterCriteria[criteria.name]
                                .values.max,
                            ]}
                            step={1}
                            onValueChange={(v) => {
                              setFiltersToBeApplied((prev) => {
                                return {
                                  ...prev,
                                  ...modifyRangeFiltersToBeApplied(
                                    criteria.name,
                                    v,
                                    filtersToBeApplied
                                  ),
                                };
                              });
                              slidersState[criteria.name] = v;
                            }}
                          />
                          <div className="flex text-gray-800 place-content-center space-x-3 m-4">
                            <p>
                              $
                              {
                                filtersToBeApplied.filterCriteria[criteria.name]
                                  .values.min
                              }
                            </p>
                            <p>
                              $
                              {
                                filtersToBeApplied.filterCriteria[criteria.name]
                                  .values.max
                              }
                            </p>
                          </div>
                        </div>
                      ) : (
                        criteria.values.map((value) => (
                          <div className="flex items-center justify-between m-2">
                            <DropdownMenuLabel>{value} </DropdownMenuLabel>
                            <Checkbox
                              checked={filtersToBeApplied.filterCriteria[
                                criteria.name
                              ].values.includes(value)}
                              onCheckedChange={(v) => {
                                setFiltersToBeApplied((prev) => {
                                  return {
                                    ...prev,
                                    ...modifyFiltersToBeApplied(
                                      v,
                                      criteria.name,
                                      value,
                                      filtersToBeApplied
                                    ),
                                  };
                                });
                                console.log(filtersToBeApplied);
                                console.log(
                                  filtersToBeApplied.filterCriteria[
                                    criteria.name
                                  ].values.includes(value)
                                );
                              }}
                            />
                          </div>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ))
              : null}
          </div>
          <div className="grid  gap-2 sm:grid-cols-3">
            {catalogStack.length &&
            catalogStack[catalogStack.length - 1].name in catalog
              ? catalog[
                  catalogStack[catalogStack.length - 1].name
                ].subcategories.map((category, index) => (
                  <Button
                    onClick={() => {
                      if (catalog[category.name]) {
                        pushToCatalogStack({
                          id: category.id,
                          name: category.name,
                        });
                      } else {
                        pushToCatalogStack({
                          id: category.id,
                          name: category.name,
                        });
                        fetchProducts(category.id).then((res) =>
                          setProducts((prev) => [...prev, ...res])
                        );
                        fetchFilters(category.id);
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
              : products.length
              ? products.map((product) => (
                  <div className=" max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
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

function initFiltersToBeApplied(data) {
  var initialFilters = {};
  if (data.filterCriteria) {
    initialFilters["filterCriteria"] = data.filterCriteria.reduce(
      (acc, item) => {
        let { id, ...newItem } = item;
        newItem.values =
          item.values.length && !isNaN(item.values[0])
            ? {
                min: Math.min(...item.values.map(Number)),
                max: Math.max(...item.values.map(Number)),
              }
            : [];
        acc[item.name] = newItem;
        return acc;
      },
      {}
    );
  }
  if (data.sortCriteria) {
    initialFilters["sortCriteria"] = {};
  }
  console.log("inititit", initialFilters["filterCriteria"]);
  return initialFilters;
}

function modifyFiltersToBeApplied(
  checked,
  filterCriterion,
  value,
  filtersToBeApplied
) {
  if (checked) {
    filtersToBeApplied.filterCriteria[filterCriterion].values.push(value);
  } else {
    filtersToBeApplied.filterCriteria[filterCriterion].values =
      filtersToBeApplied.filterCriteria[filterCriterion].values.filter(
        (item) => item !== value
      );
  }
  return filtersToBeApplied;
  // console.log(filtersToBeApplied.current.filterCriteria)
  // console.log(filtersToBeApplied.current.filterCriteria[filterCriterion].values.includes(value));
}

function modifyRangeFiltersToBeApplied(
  filterCriterion,
  values,
  filtersToBeApplied
) {
  filtersToBeApplied.filterCriteria[filterCriterion].values = {
    min: values[0],
    max: values[1],
  };
  return filtersToBeApplied;
}

function modifySortCriterionToBeApplied(
  sortCriterion,
  order,
  filtersToBeApplied
) {
  filtersToBeApplied.sortCriteria =
    filtersToBeApplied.sortCriteria.name == sortCriterion &&
    filtersToBeApplied.sortCriteria.order == order
      ? {}
      : {
          name: sortCriterion,
          order: order,
        };
  console.log("ftba", filtersToBeApplied);
  return filtersToBeApplied;
}
