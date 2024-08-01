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
import isEqual from "lodash.isequal";

const App = () => {
  const [catalog, setCatalog] = useState({});
  const [catalogStack, setCatalogStack] = useState([]);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({});
  const [showSearchResults, toggleShowSearchResults] = useState(false);
  const [searchQuery,setSearchQuery] = useState("");
  var prevFilterBody = useRef({});
  const searchResults = useRef([]);
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
  const fetchProductsBySearchQuery = async (searchQuery) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/v1/products/search?q=${searchQuery}`,
        {
          method: "GET",
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
      setFilters(initFilters(data));
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
              if (showSearchResults) {
                toggleShowSearchResults(false);
                searchResults.current = [];
                 setSearchQuery("");
              } else {
                if (catalogStack.length > 1) {
                  popFromCatalogStack();
                }
                if (products && products.length) {
                  setProducts([]);
                  setFilters({});
                }
              }
            }}
            type="submit"
          >
            <IoIosArrowBack />
          </Button>
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery (e.target.value);
              if (e.target.value == "") {
                toggleShowSearchResults(false);
                searchResults.current = [];
              }
              console.log(e.target.value,searchQuery)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (searchQuery != "") {
                  fetchProductsBySearchQuery(e.target.value).then((res) => {
                    searchResults.current = res;
                    toggleShowSearchResults(true);
                    console.log("sr", res);
                  });
                }
              }
            }}
          />
        </div>

        <div className="m-6">
          {showSearchResults ? (
            <div className="grid  gap-2 sm:grid-cols-3">
              {searchResults.current.length ? searchResults.current.map((product) => (
                <div
                  key={product.id}
                  className=" max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
                >
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
              )):<p className="flex items-center justify-center col-span-3 h-28 font-bold">No Results!</p>}
            </div>
          ) : (
            <>
              <Breadcrumb className="h-10">
                <BreadcrumbList>
                  {catalogStack.map((category, index) => (
                    <div className="flex items-center" key={category.id}>
                      {index > 0 ? (
                        <BreadcrumbSeparator className="me-2" />
                      ) : null}
                      <BreadcrumbItem>
                        {category.name == "root"
                          ? "Catalog"
                          : category.name.charAt(0).toUpperCase() +
                            category.name.slice(1)}
                      </BreadcrumbItem>
                    </div>
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
                      var newFilterBody = generateFilterBody(filters);
                      if (
                        !v &&
                        !isEqual(newFilterBody, prevFilterBody.current)
                      ) {
                        fetchProducts(
                          catalogStack[catalogStack.length - 1].id,
                          newFilterBody
                        ).then((res) => {
                          setProducts(res ?? []);
                        });
                        prevFilterBody.current = newFilterBody;
                      }
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="rounded-full font-bold"
                      >
                        sort
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {filters.sortCriteria.possibleValues.map((value) => (
                        <div key={value}>
                          <DropdownMenuLabel className="flex items-center justify-between m-2">
                            <DropdownMenuCheckboxItem
                              checked={
                                filters.sortCriteria.value.name == value &&
                                filters.sortCriteria.value.order == "asc"
                              }
                              onCheckedChange={(v) => {
                                setFilters((prev) => {
                                  return {
                                    ...prev,
                                    ...modifySortCriterionToBeApplied(
                                      value,
                                      "asc",
                                      filters
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
                                filters.sortCriteria.value.name == value &&
                                filters.sortCriteria.value.order == "desc"
                              }
                              onCheckedChange={(v) => {
                                setFilters((prev) => {
                                  return {
                                    ...prev,
                                    ...modifySortCriterionToBeApplied(
                                      value,
                                      "desc",
                                      filters
                                    ),
                                  };
                                });
                              }}
                            >
                              {value}
                              &nbsp;&nbsp;&nbsp;&nbsp;(dec)&nbsp;&nbsp;&nbsp;&nbsp;
                            </DropdownMenuCheckboxItem>
                          </DropdownMenuLabel>
                        </div>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
                {Object.keys(filters).length > 0
                  ? Object.values(filters.filterCriteria).map((criteria) => (
                      <DropdownMenu
                        key={criteria.id}
                        className="border-black "
                        onOpenChange={(v) => {
                          var newFilterBody = generateFilterBody(filters);
                          if (
                            !v &&
                            !isEqual(newFilterBody, prevFilterBody.current)
                          ) {
                            fetchProducts(
                              catalogStack[catalogStack.length - 1].id,
                              newFilterBody
                            ).then((res) => {
                              setProducts(res ?? []);
                            });
                            prevFilterBody.current = newFilterBody;
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
                                  Math.min(
                                    ...criteria.possibleValues.map(Number)
                                  ),
                                  Math.max(
                                    ...criteria.possibleValues.map(Number)
                                  ),
                                ]}
                                max={Math.max(
                                  ...criteria.possibleValues.map(Number)
                                )}
                                min={Math.min(
                                  ...criteria.possibleValues.map(Number)
                                )}
                                value={[
                                  filters.filterCriteria[criteria.name].values
                                    .min,
                                  filters.filterCriteria[criteria.name].values
                                    .max,
                                ]}
                                step={1}
                                onValueChange={(v) => {
                                  setFilters((prev) => {
                                    return {
                                      ...prev,
                                      ...modifyRangeFilters(
                                        criteria.name,
                                        v,
                                        filters
                                      ),
                                    };
                                  });
                                }}
                              />
                              <div className="flex text-gray-800 place-content-center space-x-3 m-4">
                                <p>
                                  $
                                  {
                                    filters.filterCriteria[criteria.name].values
                                      .min
                                  }
                                </p>
                                <p>
                                  $
                                  {
                                    filters.filterCriteria[criteria.name].values
                                      .max
                                  }
                                </p>
                              </div>
                            </div>
                          ) : (
                            criteria.possibleValues.map((value) => (
                              <div
                                key={value}
                                className="flex items-center justify-between m-2"
                              >
                                <DropdownMenuLabel>{value} </DropdownMenuLabel>
                                <Checkbox
                                  checked={filters.filterCriteria[
                                    criteria.name
                                  ].values.includes(value)}
                                  onCheckedChange={(v) => {
                                    setFilters((prev) => {
                                      return {
                                        ...prev,
                                        ...modifyFiltersToBeApplied(
                                          v,
                                          criteria.name,
                                          value,
                                          filters
                                        ),
                                      };
                                    });
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
                        key={category.id}
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
                        type="submit"
                        className="hover:bg-red-200 bg-red-100 font-bold text-red-500"
                      >
                        {category.name.charAt(0).toUpperCase() +
                          category.name.slice(1)}
                      </Button>
                    ))
                  : products.length
                  ? products.map((product) => (
                      <div
                        key={product.id}
                        className=" max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
                      >
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;

function generateFilterBody(filters) {
  var filterBody = {};
  console.log("gen", filters);
  var filterCriteria = Object.values(filters.filterCriteria)
    .filter(
      (value) =>
        value.values.length ||
        (value.values.min &&
          !(
            value.values.min == Math.min(...value.possibleValues.map(Number)) &&
            value.values.max == Math.max(...value.possibleValues.map(Number))
          ))
    )
    .map((e) => {
      var { id, possibleValues, ...newItem } = e;
      return newItem;
    });

  if (filterCriteria.length) {
    filterBody.filterCriteria = filterCriteria;
  }

  if (Object.keys(filters.sortCriteria.value).length) {
    filterBody.sortCriteria = filters.sortCriteria.value;
  }
  console.log("filters", filterBody);
  return filterBody;
}

function initFilters(data) {
  var initialFilters = {};
  if (data.filterCriteria) {
    initialFilters["filterCriteria"] = data.filterCriteria.reduce(
      (acc, item) => {
        item.possibleValues = item.values;
        item.values =
          item.possibleValues.length && !isNaN(item.possibleValues[0])
            ? {
                min: Math.min(...item.possibleValues.map(Number)),
                max: Math.max(...item.possibleValues.map(Number)),
              }
            : [];

        acc[item.name] = item;
        return acc;
      },
      {}
    );
  }
  initialFilters.sortCriteria = {
    value: {},
    possibleValues: data.sortCriteria,
  };
  console.log("inititit", initialFilters);
  return initialFilters;
}

function modifyFiltersToBeApplied(checked, filterCriterion, value, filters) {
  if (checked) {
    filters.filterCriteria[filterCriterion].values.push(value);
  } else {
    filters.filterCriteria[filterCriterion].values = filters.filterCriteria[
      filterCriterion
    ].values.filter((item) => item !== value);
  }
  return filters;
}

function modifyRangeFilters(filterCriterion, values, filters) {
  filters.filterCriteria[filterCriterion].values = {
    min: values[0],
    max: values[1],
  };
  return filters;
}

function modifySortCriterionToBeApplied(sortCriterion, order, filters) {
  filters.sortCriteria.value =
    filters.sortCriteria.value.name == sortCriterion &&
    filters.sortCriteria.value.order == order
      ? {}
      : {
          name: sortCriterion,
          order: order,
        };
  console.log("ftba", filters);
  return filters;
}
