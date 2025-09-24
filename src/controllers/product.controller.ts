import { Request, Response } from "express"
import { createProduct, getAllProductsRatingsService } from "../services/product.service"
import uploadToCloudinary from "../utils/cloudinary"
import { getVendorProducts, getAllProducts, getTopSellingProducts, deleteProduct, updateProduct  } from "../services/product.service"
import { Prisma } from "@prisma/client";


export const addProduct = async (req: Request, res: Response) => {
  const { productName, description } = req.body;
  const price = parseFloat(req.body.price);
  const qtyAvailable = parseInt(req.body.qtyAvailable);

  if (!productName || isNaN(price) || isNaN(qtyAvailable)) {
    return res.status(400).json({
      success: false,
      message: "Product name, price, and quantity are required and must be valid"
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Product image is required"
    });
  }

  try {
    const cloudRes = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    const product = await createProduct(
      req.user!.id,
      productName,
      price,
      qtyAvailable,
      description,
      cloudRes.secure_url,
     
    );

    return res.status(201).json({
      success: true,
      message: "Product posted successfully",
      data: product
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to upload product"
    });
  }
};

export const fetchVendorProducts = async (req: Request, res: Response) => {
  const vendorId = req.user?.id;

  if (!vendorId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Vendor ID missing",
    });
  }

  try {
    const products = await getVendorProducts(vendorId);
    return res.status(200).json({
      success: true,
      message: "Vendor products fetched successfully",
      data: products,
    });
  } catch (err: any) {
    console.error("❌ Error fetching vendor products:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch vendor products",
      error: err instanceof Prisma.PrismaClientKnownRequestError ? err.meta : err.message,
    });
  }
};


export const fetchAllProducts = async (_req: Request, res: Response) => {
  try {
    const products = await getAllProducts();
    return res.status(200).json({
      success: true,
      message: "All products fetched successfully",
      data: products,
    });
  } catch (err: any) {
    console.error("❌ Error fetching all products:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch all products",
      error: err instanceof Prisma.PrismaClientKnownRequestError ? err.meta : err.message,
    });
  }
};


export const getAllProductsRatings = async (_req: Request, res: Response) => {
  
    try {
        const productsRating = await getAllProductsRatingsService();
        return res.status(200).json({
            success: true,
            message: "All products Ratings fetched successfully",
            data: productsRating,
        });
    }
    catch (err: any) {
    console.error("❌ Error fetching all products:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch all products",
      error: err instanceof Prisma.PrismaClientKnownRequestError ? err.meta : err.message,
    });
  }
};


export const fetchTopSellingProducts = async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10);

  if (isNaN(limit) || limit <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid limit value. Must be a positive number.",
      data: { limit: req.query.limit },
    });
  }

  try {
    const products = await getTopSellingProducts(limit);
    return res.status(200).json({
      success: true,
      message: "Top selling products fetched successfully",
      data: products,
    });
  } catch (err: any) {
    console.error("❌ Error fetching top selling products:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch top selling products",
      error: err instanceof Prisma.PrismaClientKnownRequestError ? err.meta : err.message,
    });
  }
};

export const editProduct = async (req: Request, res: Response) => {
  const vendorId = req.user?.id;
  const { productId } = req.params;
  const { productName, price, qtyAvailable, description } = req.body;

  if (!vendorId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Vendor ID missing",
    });
  }

  if (!productId || !productName || price === undefined || qtyAvailable === undefined) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
      data: { productId, productName, price, qtyAvailable },
    });
  }

  try {
    let pictureUrl: string | undefined;

    if (req.file) {
      const cloudinaryRes = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      pictureUrl = cloudinaryRes.secure_url;
    }

    const updatedProduct = await updateProduct(
      productId,
      vendorId,
      productName,
      Number(price),
      Number(qtyAvailable),
      description,
      pictureUrl
    );

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (err: any) {
    console.error("❌ Error editing product:", err);

    let statusCode = 500;
    let message = "Failed to update product";

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        message = "Product not found or not owned by vendor";
        statusCode = 404;
      } else if (err.code === "P2003") {
        message = "Invalid relation: vendor or product not found";
        statusCode = 400;
      }
    }

    return res.status(statusCode).json({
      success: false,
      message,
      error: err.message,
    });
  }
};

export const removeProduct = async (req: Request, res: Response) => {
  const { productId } = req.params;

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: "Product ID is required",
    });
  }

  try {
    await deleteProduct(productId);
    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: { productId },
    });
  } catch (err: any) {
    console.error("❌ Error deleting product:", err);

    let statusCode = 500;
    let message = "Failed to delete product";

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        message = "Product not found or already deleted";
        statusCode = 404;
      } else if (err.code === "P2003") {
        message = "Cannot delete product due to existing references (e.g., orders)";
        statusCode = 400;
      }
    }

    return res.status(statusCode).json({
      success: false,
      message,
      error: err.message,
      data: { productId },
    });
  }
};

