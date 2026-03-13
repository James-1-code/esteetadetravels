import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plane, Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
      <div className="text-center max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Plane className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-8xl font-bold text-white mb-4">404</h1>
          <div className="w-24 h-1 bg-[#d4af37] mx-auto mb-6" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-white/70 mb-8">
            Oops! The page you're looking for seems to have taken off. Let's get you back on track.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button size="lg" className="bg-white text-[#0a9396] hover:bg-white/90">
                <Home className="w-5 h-5 mr-2" />
                Go Home
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
