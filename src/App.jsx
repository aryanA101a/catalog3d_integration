import React, { useRef } from "react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IoIosArrowBack, IoMdRemoveCircle } from "react-icons/io";
import { IoMdArrowForward } from "react-icons/io";

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

import oauthSignature from "oauth-signature";
import CryptoJS from "crypto-js";

const App = () => {
  const [catalog, setCatalog] = useState({});
  const [catalogStack, setCatalogStack] = useState([]);
  // const [products, setProducts] = useState({});
  const productCache = useRef(new ProductCache());
  const [showProducts, setShowProducts] = useState(false);
  const [showVariantBar, setShowVariantBar] = useState(false);
  const [variantBarData, setVariantBarData] = useState({});
  const [filters, setFilters] = useState({});
  const [showSearchResults, toggleShowSearchResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [cartProducts, setCartProducts] = useState({});

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const cartId = queryParams.get("cartId");
  // console.log(`cartId: ${cartId}`);

  var prevFilterBody = useRef({});
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
      const query = `
      query {
        collections {
          items {
            id
            name
            slug
            parent {
              id
            }
            children{
            id
            }
          }
          totalItems
        }
      }
    `;

      const headers = {
        "Content-Type": "application/json",
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/shop-api`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      return data;
    } catch (error) {
      console.log("Error fetching data", error);
      return {};
    }
  };

  async function retrieveCatalog() {
    const data = await fetchCatalog();
    pushToCatalogStack({ id: 1, name: "root" });
    setCatalog(processCatalogApiResponse(data));
  }

  async function retrieveProducts(categoryId) {
    console.log("retrieveProducts");
    const data = await fetchProducts(categoryId);
    const res = processProductsApiResponse(data);
    productCache.current.addProducts(res, categoryId);
  }

  const fetchProducts = async (categoryId) => {
    try {
      console.log(import.meta.env.VITE_API_URL);
      const query = `
      query {
        search(
          input: {
            collectionId: ${categoryId},
            groupByProduct: true,
            }
        ) {
          totalItems
          items {
            productId
            productName
            slug
            sku
            productVariantName
            productAsset {
              id
              preview
            }
            priceWithTax {
              ... on SinglePrice {
                value
              }
              ... on PriceRange {
                min
                max
              }
            }
            currencyCode
          }
        }
      }
    `;

      const headers = {
        "Content-Type": "application/json",
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/shop-api`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      return data;
    } catch (error) {
      console.log("Error fetching data", error);
      return {};
    }
  };

  const fetchProductDetails = async (productId) => {
    try {
      console.log(import.meta.env.VITE_API_URL);
      const query = `
      query {
        product(id: ${productId}){
        assets{
        name
        type
        source
        }
        variants{
        sku
        name
        priceWithTax
        assets{
        name
        type
        source
        }

        }
        }
      }
    `;

      const headers = {
        "Content-Type": "application/json",
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/shop-api`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      return data.data.product;
    } catch (error) {
      console.log("Error fetching data", error);
      return null;
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

  async function updateProductWithDetails(productId) {
    const productDetails = await fetchProductDetails(productId);
    console.log(productDetails);

    let variants = {};
    if (productDetails.variants.length > 1) {
      variants = productDetails.variants.slice(1).reduce((acc, v) => {
        acc[v.sku] = {
          ...v,
          assets: v.assets.map((a) => a.source),
        };
        return acc;
      }, {});
    }

    productCache.current.updateProduct({
      ...productCache.current.getProductById(productId),
      details: {
        ...productDetails,
        variants: variants,
      },
    });
    console.log(variants);
    console.log(productCache.current.getProductById(productId));
  }

  const handleVariantChange = (variant) => {
    console.log("Selected variant:", variant);
  };

  useEffect(() => {
    retrieveCatalog();
  }, []);
  return (
    <div className="h-screen m-4 grid gap-4 sm:grid-cols-12 flex ">
      <div className="h-screen rounded-lg bg-gray-100 sm:col-span-4 relative">
        <div className="flex w-full max-w-sm items-center space-x-2 m-6 ">
          <Button
            onClick={() => {
              // if (showSearchResults) {
              //   toggleShowSearchResults(false);
              //   setSearchResults([]);
              //   setSearchQuery("");
              // } else {
              if (catalogStack.length > 1) {
                popFromCatalogStack();
              }
              if (showProducts) {
                // setProducts({});
                // setCartProducts({});
                setShowProducts(() => false);
                setShowVariantBar(() => false);
                setVariantBarData(() => {});

                setFilters({});
              }
              // }
            }}
            type="submit"
          >
            <IoIosArrowBack />
          </Button>
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value == "") {
                toggleShowSearchResults(false);
                setSearchResults([]);
              }
              console.log(e.target.value, searchQuery);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (searchQuery != "") {
                  fetchProductsBySearchQuery(e.target.value).then((res) => {
                    setSearchResults(res);
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
              {searchResults.length ? (
                searchResults.map((product) => (
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
              ) : (
                <p className="flex items-center justify-center col-span-3 h-28 font-bold">
                  No Results!
                </p>
              )}
            </div>
          ) : (
            <>
              <Breadcrumb className="h-10">
                <BreadcrumbList>
                  {catalogStack.length > 4
                    ? [
                        ...catalogStack.slice(0, 2),
                        catalogStack[catalogStack.length - 1],
                      ].map((category, index) => (
                        <div className="flex items-center" key={category.id}>
                          {index > 0 ? (
                            <BreadcrumbSeparator className="me-2" />
                          ) : null}
                          {index == 2 ? (
                            <>
                              ..... &nbsp;
                              <BreadcrumbSeparator className="me-2" />
                            </>
                          ) : null}
                          <BreadcrumbItem>
                            {category.name == "root"
                              ? "Catalog"
                              : category.name.charAt(0).toUpperCase() +
                                category.name.slice(1)}
                          </BreadcrumbItem>
                        </div>
                      ))
                    : catalogStack.map((category, index) => (
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
              {/* <div
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
              </div> */}
              {catalogStack.length &&
              catalog[catalogStack[catalogStack.length - 1].id].children
                .length ? (
                <div className="grid  gap-2 sm:grid-cols-1">
                  {catalog[catalogStack[catalogStack.length - 1].id].children
                    .map((c) => catalog[c.id])
                    .map((category) => (
                      <Button
                        key={category.id}
                        onClick={() => {
                          if (catalog[category.id].children.length) {
                            console.log(category);
                            pushToCatalogStack({
                              id: category.id,
                              name: category.name,
                            });
                          } else {
                            console.log("kiki");

                            pushToCatalogStack({
                              id: category.id,
                              name: category.name,
                            });

                            if (
                              !productCache.current.getProductsBySubcategoryId(
                                category.id
                              ).length
                            ) {
                              retrieveProducts(category.id).then(() => {
                                setShowProducts(() => true);

                                productCache.current
                                  .getProductsBySubcategoryId(category.id)
                                  .map((p) => updateProductWithDetails(p.id));
                              });
                            } else {
                              setShowProducts(() => true);
                            }
                          }
                        }}
                        type="submit"
                        className="hover:bg-gray-300 bg-gray-200 font-semibold text-gray-900 text-transform: capitalize"
                      >
                        {category.name.replaceAll("-", " ")}
                      </Button>
                    ))}
                </div>
              ) : showProducts ? (
                <div className="grid  gap-2 sm:grid-cols-3">
                  {productCache.current
                    .getProductsBySubcategoryId(
                      catalogStack[catalogStack.length - 1].id
                    )
                    .map((product) => (
                      <div
                        key={product.id}
                        onClick={() => {
                          setVariantBarData((prev) => ({
                            id: product.id,
                          }));
                          console.log("ncnc: ", variantBarData?.id);
                          if (product.id == variantBarData?.id) {
                            setShowVariantBar((prev) => {
                              if (prev) {
                                setVariantBarData(() => {});
                              }
                              return !prev;
                            });
                          } else {
                            setShowVariantBar((prev) => true);
                          }
                        }}
                        className={`${
                          showVariantBar && variantBarData.id != product.id
                            ? "opacity-15" // Use a valid Tailwind CSS opacity class
                            : ""
                        } max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700`}
                      >
                        <img
                          className="rounded-t-lg"
                          src={product.thumbnail}
                          alt=""
                          draggable
                          onDragStart={(e) => {
                            handleOnDrag(e, product.id);
                            console.log(
                              "onDragStart: " +
                                productCache.current.getProductById(product.id)
                                  .details
                            );
                          }}
                        />
                        <div className="p-5">
                          <h5 className="mb-2  font-bold tracking-tight text-gray-900 dark:text-white line-clamp-3">
                            {product.name}
                          </h5>
                        </div>
                      </div>
                    ))}
                </div>
              ) : null}

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
        {showVariantBar && variantBarData?.id ? (
          <div className="bottom-10 absolute w-full">
            <ProductVariantSelector
              name={productCache.current.getProductById(variantBarData.id).name}
              productVariants={
                productCache.current.getProductById(variantBarData.id).details
                  .variants || {}
              }
              callbackFunction={(v) =>
                setVariantBarData((prev) => ({ ...prev, selected: v }))
              }
            />
          </div>
        ) : null}
      </div>
      <div className="flex items-center h-screen  sm:col-span-6 sm:col-start-6 ">
        <div
          className="relative h-3/4 w-full rounded-lg bg-gray-100 p-4 overflow-hidden  "
          onDrop={(e) => {
            console.log("dwn", variantBarData?.selected);
            const productId = handleOnDrop(e);
            const product = productCache.current.getProductById(productId);
            const key = Object.keys(product.details?.variants).length
              ? variantBarData?.selected ||
                Object.keys(product.details.variants)?.[0]
              : product?.sku;
            console.log("mimi: " + key);
            console.log(
              `${variantBarData?.selected} - ${
                Object.keys(product.details.variants)?.[0]
              } - ${product?.sku}`
            );
            setCartProducts((prev) => ({
              ...prev,
              [key]: {
                ...prev[key],
                id: productId,
                quantity: (prev[key]?.quantity || 0) + 1,
                selectedVariant: variantBarData?.selected || "default",
              },
            }));
          }}
          onDragOver={handleDragOver}
        >
          <h1 className="text-gray-900 text-2xl font-bold">Cart</h1>
          <div className="absolute bottom-4 right-4">
            <button
              onClick={() =>
                pushAllCartProductsToMagento().then(() => {
                  setCartProducts({});
                  window.location.href =
                    "https://commercenexgen.com/checkout/cart/index/";
                })
              }
              className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-full flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors duration-300"
            >
              <span>Continue</span>
              <IoMdArrowForward />
            </button>
          </div>
          <div className="absolute bottom-4 left-4">
            <button
              onClick={() => setCartProducts({})}
              className="bg-gray-700 text-white  py-2 px-4 rounded-full flex items-center justify-center space-x-2 hover:bg-gray-700 transition-colors duration-300"
            >
              <span>Clear</span>
            </button>
          </div>
          <div className="overflow-y-scroll max-h-80">
            {Object.values(cartProducts).map((cartProduct) => {
              const p = productCache.current.getProductById(cartProduct.id);
              const cp = cartProduct;
              console.log(`vs:${JSON.stringify(p)}`);
              return (
                <ProductListItem
                  key={p.id}
                  imageUrl={
                    cp.selectedVariant == "default"
                      ? p.thumbnail
                      : p.details.variants[cp.selectedVariant]?.assets[0] || ""
                  }
                  name={p.name}
                  quantity={cartProduct.quantity}
                  price={p.price}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  async function pushAllCartProductsToMagento() {
    console.log("continueToMagento");
    const oauthCredentials = {
      consumerKey: "wqnv1x4gdynaub2i5myxsf83h7drgfbz",
      consumerSecret: "jaw3f566qkp72dv72fr3rzurhe44xupi",
      accessToken: "wjptpm13cmphj70a71ime34yagwwbgd9",
      tokenSecret: "boeqczsifjhuct2yn6j5s93tbtafysy8",
    };

    const cartProductEntries = Object.entries(cartProducts).map(
      ([variantSku, cp]) => {
        const product = productCache.current.getProductById(cp.id);
        return { variantSku, cp, product };
      }
    );

    for (const { variantSku, cp, product } of cartProductEntries) {
      if (!Object.keys(product.details?.variants).length) {
        await pushToMagentoCart(
          cartId,
          createSimpleProductRequestBody(product.sku, cartId, cp.quantity),
          oauthCredentials
        );
      } else {
        const optionId = await fetchOptionId(product.sku, oauthCredentials);
        const optionValue = await fetchOptionValue(
          product.sku,
          variantSku,
          oauthCredentials
        );

        const res = await pushToMagentoCart(
          cartId,
          createConfigurableProductRequestBody(
            product.sku,
            cartId,
            cp.quantity,
            optionId,
            optionValue
          ),
          oauthCredentials
        );
        console.log(`yoohoo - ${res}`);
      }
    }
  }
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

function processCatalogApiResponse(apiResponse) {
  const result = {};

  // Iterate through each item in the API response
  apiResponse.data.collections.items.forEach((item) => {
    // Add the item to the categories map
    result[item.id] = {
      id: item.id,
      name: item.name,
      slug: item.slug,
      children: item.children,
    };

    // If the item's parent ID is '1', add it to the root's children
    if (item.parent && item.parent.id === "1") {
      if (1 in result) {
        result[1].children.push({ id: item.id });
      } else {
        result[1] = {
          id: item.id,
          name: "root",
          slug: "root",
          children: [{ id: item.id }],
        };
      }
    }
  });

  return result;
}

function processProductsApiResponse(apiResponse) {
  // Iterate through each item in the API response
  console.log(apiResponse.data.search.items);
  return apiResponse.data.search.items.map((p) => ({
    id: p.productId,
    thumbnail: p.productAsset.preview,
    name: p.productName,
    slug: p.slug,
    sku: p.sku,
    price: ~~(p.priceWithTax.max / 100),
  }));
}

function handleOnDrag(e, productId) {
  e.dataTransfer.setData("productId", JSON.stringify(productId));
  console.log(`handleOnDrag: ${productId}`);
}

function handleOnDrop(e) {
  const productId = JSON.parse(e.dataTransfer.getData("productId"));
  console.log("handleOnDrop: " + productId);
  return productId;
}

function handleDragOver(e) {
  e.preventDefault();
}

async function callMagentoApi(method, url, body, oauthCredentials) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = CryptoJS.lib.WordArray.random(16).toString();
  const parameters = {
    oauth_consumer_key: oauthCredentials.consumerKey,
    oauth_token: oauthCredentials.accessToken,
    oauth_signature_method: "HMAC-SHA256",
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: "1.0",
  };

  const paramString = Object.keys(parameters)
    .sort()
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(parameters[key])}`
    )
    .join("&");

  const signatureBaseString = `${method}&${encodeURIComponent(
    url
  )}&${encodeURIComponent(paramString)}`;

  const signingKey = `${encodeURIComponent(
    oauthCredentials.consumerSecret
  )}&${encodeURIComponent(oauthCredentials.tokenSecret)}`;

  const signature = CryptoJS.HmacSHA256(
    signatureBaseString,
    signingKey
  ).toString(CryptoJS.enc.Base64);

  const authHeader =
    `OAuth oauth_consumer_key="${encodeURIComponent(
      oauthCredentials.consumerKey
    )}",` +
    `oauth_token="${encodeURIComponent(oauthCredentials.accessToken)}",` +
    `oauth_signature_method="HMAC-SHA256",` +
    `oauth_timestamp="${timestamp}",` +
    `oauth_nonce="${nonce}",` +
    `oauth_version="1.0",` +
    `oauth_signature="${encodeURIComponent(signature)}"`;

  const headers = {
    Authorization: authHeader,
    "Content-Type": "application/json",
  };

  const requestOptions = {
    method: method,
    headers: headers,
  };

  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, requestOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// Function to push to Magento cart
async function pushToMagentoCart(cartId, requestBody, oauthCredentials) {
  const apiUrl = `https://commercenexgen.com/rest/V1/carts/${cartId}/items`;
  const method = "POST";

  try {
    const result = await callMagentoApi(
      method,
      apiUrl,
      requestBody,
      oauthCredentials
    );
    return result;
  } catch (error) {
    console.error("Error pushing to Magento cart:", error);
    throw error;
  }
}

function createSimpleProductRequestBody(sku, cartId, quantity) {
  return {
    cartItem: {
      sku: sku,
      quoteId: cartId,
      qty: quantity,
    },
  };
}

function createConfigurableProductRequestBody(
  sku,
  cartId,
  quantity,
  optionId,
  optionValue
) {
  return {
    cartItem: {
      sku: sku,
      quoteId: cartId,
      qty: quantity,
      product_option: {
        extension_attributes: {
          configurable_item_options: [
            {
              option_id: optionId,
              option_value: optionValue,
            },
          ],
        },
      },
      extension_attributes: {},
    },
  };
}

const ProductListItem = ({
  name,
  description,
  dimensions,
  quantity,
  price,
  articleNumber,
  imageUrl,
}) => (
  <div className="flex border-b border-gray-200 py-4">
    <div className="w-24 h-18 mr-4 flex-shrink-0">
      <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
    </div>
    <div className="flex-grow">
      <div className="flex justify-between mb-2">
        <div>
          <h3 className="font-bold text-lg">{name}</h3>
          {/* <p className="text-sm text-gray-600">{description}</p>
          <p className="text-xs text-gray-500">{dimensions}</p> */}
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">$ {price}</p>
          <p className="text-sm">{quantity}x</p>
        </div>
      </div>
      {/* <div className="bg-black text-white text-xs py-1 px-2 inline-block">
        {articleNumber}
      </div> */}
    </div>
  </div>
);

const ProductVariantSelector = ({
  name,
  productVariants,
  callbackFunction,
}) => {
  const variantArray = Object.values(productVariants);
  console.log("va" + JSON.stringify(variantArray));
  const [selectedVariant, setSelectedVariant] = useState(variantArray[0]);
  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    callbackFunction(variant);
  };
  return (
    <div className=" rounded-lg bg-white shadow-lg p-3 m-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg m-2 text-gray-800">{name}</h2>
        <div className="flex items-center  ">
          {variantArray.map((variant) => (
            <button
              key={variant.sku}
              onClick={() => handleVariantChange(variant.sku)}
              className={`w-10 h-10 mx-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 overflow-hidden  ${
                selectedVariant?.sku === variant.sku
                  ? "ring-2 ring-blue-500 ring-offset-2"
                  : "hover:ring-2 hover:ring-gray-300 hover:ring-offset-2"
              }`}
            >
              <img
                src={variant.assets[0]}
                alt={variant.name}
                className="w-full h-full object-cover "
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

class ProductCache {
  constructor() {
    this.products = new Map();
    this.subcategoryIndex = new Map();
  }

  addProduct(product, subcategoryId) {
    this.products.set(product.id, product);

    if (!this.subcategoryIndex.has(subcategoryId)) {
      this.subcategoryIndex.set(subcategoryId, new Set());
    }
    this.subcategoryIndex.get(subcategoryId).add(product.id);
  }

  addProducts(products, subcategoryId) {
    for (const product of products) {
      this.addProduct(product, subcategoryId);
    }
  }

  updateProduct(updatedProduct) {
    if (!this.products.has(updatedProduct.id)) {
      throw new Error(`Product with ID ${updatedProduct.id} not found.`);
    }

    this.products.set(updatedProduct.id, updatedProduct);
  }

  getProductById(productId) {
    return this.products.get(productId);
  }

  getProductsBySubcategoryId(subcategoryId) {
    const productIds = this.subcategoryIndex.get(subcategoryId) || new Set();
    return Array.from(productIds).map((id) => this.products.get(id));
  }
}

async function fetchOptionValue(sku, variantSku, oauthCredentials) {
  const url = `https://commercenexgen.com/rest/V1/configurable-products/${sku}/children`;

  try {
    const data = await callMagentoApi("GET", url, null, oauthCredentials);

    const variant = data.find((item) => item.sku === variantSku);
    if (!variant) {
      throw new Error(`Variant with SKU ${variantSku} not found`);
    }

    const variantAttribute = variant.custom_attributes.find(
      (attr) => attr.attribute_code === "variant"
    );
    if (!variantAttribute) {
      throw new Error(`Variant attribute not found for SKU ${variantSku}`);
    }

    return variantAttribute.value;
  } catch (error) {
    console.error("Error fetching option value:", error);
    throw error;
  }
}

async function fetchOptionId(sku, oauthCredentials) {
  const url = `https://commercenexgen.com/rest/V1/configurable-products/${sku}/options/all`;

  try {
    const data = await callMagentoApi("GET", url, null, oauthCredentials);

    const variantOption = data.find((option) => option.label === "Variant");
    if (!variantOption) {
      throw new Error("Variant option not found");
    }

    return variantOption.attribute_id;
  } catch (error) {
    console.error("Error fetching option ID:", error);
    throw error;
  }
}
