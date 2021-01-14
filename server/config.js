const CLIENT_ID =
  process.env.CLIENT_ID || "AfPbdUbV4LJdK0-0B0QPeUyHnzGgVhIwZfBO3wYRoazaSYRJAIKwwHnfI0EbekJB42FJuVi-3-vgsQvi";

const CLIENT_SECRET =
  process.env.CLIENT_SECRET || "EC2EhwyUx6gPlc4j-PtCXd0CZKCqXr9HzKBQi4zWbTeCt4ddEXZVqTsz9o0bHoa3-Cv6bvlQnzfhY2Ur";

const isProd = process.env.NODE_ENV === "production";

const PAYPAL_API_URL = isProd
  ? "https://api.paypal.com"
  : "https://api.sandbox.paypal.com";


const MERCHANT_URL = isProd
  ? "http://example.com" // merchant live url
  : "http://localhost:8080";

module.exports = {
  PAYPAL_API_URL,
  CLIENT_ID,
  CLIENT_SECRET,
  MERCHANT_URL,
};
