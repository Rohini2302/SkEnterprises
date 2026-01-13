// src/services/erpApi.ts
import axios from "axios";

const API_BASE_URL = 'http://localhost:5001/api'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --------- Products ---------
interface GetProductsParams {
  page?: number;
  limit?: number;
  department?: string;
  category?: string;
  site?: string;
  search?: string;
}


export const getProducts = async (params: GetProductsParams = {}) => {
  try {
    console.log("🟡 Fetching products with params:", params);

    const res = await api.get("/products", { params });
    console.log("🟢 Products API response:", res.data);

    // Extract products and total from response
    return {
      products: res.data.products || [],
      total: res.data.total || 0,
    };
  } catch (error) {
    console.error("🔴 Error fetching products:", error);
    return {
      products: [],
      total: 0,
    };
  }
};

// --------- Departments ---------
export const getDepartments = async () => {
  try {
    const res = await api.get("/departments");
    return res.data || [];
  } catch (error) {
    console.error("Error fetching departments:", error);
    return [];
  }
};

// --------- Department Categories ---------
export const getDepartmentCategories = async (departmentId: string) => {
  try {
    const res = await api.get(
      `/department-categories?department=${departmentId}`
    );
    return res.data || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

// --------- Sites ---------
export const getSites = async () => {
  try {
    console.log("🟡 Fetching sites from API");
    const res = await api.get("/mongo/sites");
    console.log("🟢 Raw API response:", res);
    console.log("🟢 Raw data:", res.data);
    console.log("🟢 Data type:", typeof res.data);
    console.log("🟢 Is array?", Array.isArray(res.data));

    // Check the actual structure
    if (res.data && typeof res.data === "object") {
      console.log("🟢 Data keys:", Object.keys(res.data));
    }

    // Process the sites data
    let sitesData = [];

    // Handle different response structures
    if (Array.isArray(res.data)) {
      sitesData = res.data;
    } else if (res.data && Array.isArray(res.data.data)) {
      sitesData = res.data.data;
    } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
      sitesData = res.data.data;
    } else if (res.data && typeof res.data === "object") {
      // Try to extract sites from various possible structures
      if (res.data.sites && Array.isArray(res.data.sites)) {
        sitesData = res.data.sites;
      } else if (res.data.data && Array.isArray(res.data.data)) {
        sitesData = res.data.data;
      } else {
        // Convert object to array if needed
        sitesData = Object.values(res.data);
      }
    }

    console.log("🟢 Processed sitesData:", sitesData);

    // Filter out invalid sites and process them
    const processedSites = sitesData
      .filter((site: any) => {
        if (!site) return false;
        const hasId = site.id || site._id || site.siteId;
        const hasName = site.name || site.siteName;
        return hasId && hasName;
      })
      .map((site: any) => {
        return {
          _id: site._id || site.id || site.siteId || "",
          id: site.id || site.siteId || site._id || "",
          name: site.name || site.siteName || "Unknown Site",
          location: site.location || site.address || "",
          city: site.city || "",
          status: site.status || "active",
          manager: site.manager || site.siteManager || "",
          totalEmployees: site.totalEmployees || 0,
          contact: site.contact || site.managerPhone || "",
        };
      });

    console.log("🟢 Final processed sites:", processedSites);
    return processedSites;
  } catch (error: any) {
    console.error("🔴 Error fetching sites:", error);
    if (error.response) {
      console.error("🔴 Error response:", error.response.data);
      console.error("🔴 Error status:", error.response.status);
    }
    // Fallback to direct API if mongo fails
    try {
      const res = await api.get("/sites");
      return res.data || [];
    } catch (fallbackError) {
      console.error("🔴 Fallback also failed:", fallbackError);
      return [];
    }
  }
};

// --------- Employees ---------
export const getEmployees = async () => {
  try {
    const res = await api.get("/employees");
    return res.data || [];
  } catch (error) {
    console.error("Error fetching employees:", error);
    return [];
  }
};

// --------- Vendors ---------
export const getVendors = async () => {
  try {
    const res = await api.get("/vendors");
    return res.data || [];
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return [];
  }
};

// --------- Create Product ---------
export const createProduct = async (productData: any) => {
    try {
      console.log("🟡 Creating product at:", `${API_BASE_URL}/products`);
      const response = await axios.post(`${API_BASE_URL}/products`, productData);
      console.log("🟢 Product created:", response.data);
      return response.data;
    } catch (error: any) {
      console.error('🔴 Error creating product:', error);
      console.error('🔴 Error response:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to create product');
    }
  }

// --------- Delete Product ---------
export const deleteProduct = async (productId: string) => {
  try {
    console.log("🟡 Deleting product:", productId);
    const res = await api.delete(`/products/${productId}`);
    console.log("🟢 Product deleted:", res.data);
    return res.data;
  } catch (error) {
    console.error("🔴 Error deleting product:", error);
    throw error;
  }
};

// --------- Change History ---------
export const addChangeHistory = async (productId: string, changeData: any) => {
  try {
    const res = await api.post(
      `/products/${productId}/change-history`,
      changeData
    );
    return res.data;
  } catch (error) {
    console.error("Error adding change history:", error);
    throw error;
  }
};

// --------- Machine Stats ---------
export const getMachineStats = async () => {
  try {
    const res = await api.get("/machine-stats");
    return res.data || [];
  } catch (error) {
    console.error("Error fetching machine stats:", error);
    return [];
  }
};

// --------- Managers ---------
export const getManagers = async () => {
  try {
    console.log("🟡 Fetching managers");
    // For now, we'll extract managers from sites
    const sites = await getSites();
    const managers = Array.from(new Set(sites.map(site => site.manager).filter(Boolean)));
    console.log("🟢 Managers fetched:", managers);
    return managers;
  } catch (error) {
    console.error("🔴 Error fetching managers:", error);
    return [];
  }
};

// --------- Export everything as erpApi ---------
export const erpApi = {
  getDepartments,
  getDepartmentCategories,
  getSites,
  getEmployees,
  getVendors,
  getProducts,
  getManagers,
  createProduct,
  deleteProduct,
  addChangeHistory,
  getMachineStats,
};

export default erpApi;