import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { motion } from "framer-motion";

export default function UnknownPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 flex flex-col items-center justify-center p-4">
      {/* Decorative Background Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-500/5" />
        <div className="absolute -left-20 bottom-1/4 h-80 w-80 rounded-full bg-blue-500/7" />
        <div className="absolute right-1/4 top-1/4 h-72 w-72 rounded-3xl bg-blue-500/4 transform rotate-45" />
        <div className="absolute left-1/3 top-1/2 h-64 w-64 rounded-full bg-blue-500/6" />

        {/* Additional decorative elements */}
        <div className="absolute right-1/3 bottom-1/3 h-40 w-40 rounded-2xl bg-blue-500/5 transform -rotate-15" />
        <div className="absolute left-1/4 top-1/3 h-20 w-3 rounded-full bg-blue-500/7" />
        <div className="absolute right-1/2 bottom-1/2 h-3 w-24 rounded-full bg-blue-500/5" />
        <div className="absolute left-2/5 top-2/5 h-24 w-24 rounded-2xl bg-blue-500/4 transform rotate-12" />

        {/* Small scattered elements */}
        <div className="absolute left-1/4 top-1/4 h-4 w-4 rounded-full bg-blue-500/20" />
        <div className="absolute right-1/3 bottom-1/4 h-6 w-6 rounded-full bg-blue-500/15" />
        <div className="absolute left-1/3 top-2/3 h-5 w-5 rounded-full bg-blue-500/10" />
        <div className="absolute right-1/4 top-1/2 h-8 w-8 rounded-lg bg-blue-500/12 transform rotate-45" />
      </div>

      {/* Content */}
      <div className="relative text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-8xl font-bold text-blue-600 mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">
            Trang không tồn tại
          </h2>
          <p className="text-xl text-gray-600 max-w-lg mx-auto mb-8">
            Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã được di
            chuyển đến địa chỉ khác.
          </p>
          <Button
            onClick={() => navigate("/")}
            size="lg"
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Trở về trang chủ
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
