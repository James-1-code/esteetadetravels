import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  Briefcase,
  PlaneTakeoff,
  Hotel,
  FileText,
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  Globe,
  Shield,
  UserCheck,
  ClipboardList,
  Scale,
  Code,
  Fingerprint,
  FileSignature,
} from 'lucide-react';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

// Service Card Component
function ServiceCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -10, transition: { duration: 0.3 } }}
      className="group bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 dark:border-slate-700"
    >
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0a9396] to-[#005f73] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

// Stats Component
function StatCard({ value, label, icon: Icon }: { value: string; label: string; icon: any }) {
  return (
    <motion.div variants={scaleIn} className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
        <Icon className="w-8 h-8 text-[#d4af37]" />
      </div>
      <div className="text-4xl lg:text-5xl font-bold text-white mb-2">{value}</div>
      <div className="text-white/70">{label}</div>
    </motion.div>
  );
}

// Testimonial Card
function TestimonialCard({ name, role, content, rating }: { name: string; role: string; content: string; rating: number }) {
  return (
    <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`w-5 h-5 ${i < rating ? 'text-[#d4af37] fill-[#d4af37]' : 'text-slate-300'}`} />
        ))}
      </div>
      <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">"{content}"</p>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0a9396] to-[#005f73] flex items-center justify-center text-white font-bold">
          {name.charAt(0)}
        </div>
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">{name}</div>
          <div className="text-sm text-slate-500">{role}</div>
        </div>
      </div>
    </motion.div>
  );
}

// Process Step
function ProcessStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <motion.div variants={fadeInUp} className="relative text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#0a9396] to-[#005f73] flex items-center justify-center text-3xl font-bold text-white shadow-lg">
        {number}
      </div>
      <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 max-w-xs mx-auto">{description}</p>
    </motion.div>
  );
}

export function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  
  const servicesRef = useRef(null);
  const statsRef = useRef(null);
  const processRef = useRef(null);
  const testimonialsRef = useRef(null);
  const ctaRef = useRef(null);
  
  const servicesInView = useInView(servicesRef, { once: true, margin: '-100px' });
  const statsInView = useInView(statsRef, { once: true, margin: '-100px' });
  const processInView = useInView(processRef, { once: true, margin: '-100px' });
  const testimonialsInView = useInView(testimonialsRef, { once: true, margin: '-100px' });
  const ctaInView = useInView(ctaRef, { once: true, margin: '-100px' });
  
  const services = [
    {
      icon: FileText,
      title: 'CV / Resume Maker',
      description: 'Professional Canadian, Europass, UK & international CV creation by expert writers to boost your career prospects.',
    },
    {
      icon: GraduationCap,
      title: 'Study Abroad',
      description: 'Full admission processing for UK, Canada, USA, Europe, and Australia. We handle everything from university selection to visa application.',
    },
    {
      icon: Briefcase,
      title: 'Work Visa Application',
      description: 'Professional job search, employer sponsorship, and work visa processing for skilled workers seeking international opportunities.',
    },
    {
      icon: PlaneTakeoff,
      title: 'Flight Booking',
      description: 'Access to cheap flight deals worldwide with fast processing and 24/7 customer support for all your travel needs.',
    },
    {
      icon: Hotel,
      title: 'Hotel Reservation',
      description: 'Verified hotel bookings anywhere in the world with best price guarantee and flexible cancellation policies.',
    },
    {
      icon: UserCheck,
      title: 'Caregiver Certification',
      description: 'Complete caregiver certification programs and placement services for qualified professionals seeking international opportunities.',
    },
    {
      icon: ClipboardList,
      title: 'Job Assessment',
      description: 'Professional skills assessment and career evaluation to determine your eligibility for various visa categories.',
    },
    {
      icon: Code,
      title: 'Web Development',
      description: 'Custom website development services including portfolio, e-commerce, business websites, and web applications.',
    },
    {
      icon: Fingerprint,
      title: 'Biometric Appointment',
      description: 'Fast-track biometric enrollment appointment scheduling for visa applications worldwide.',
    },
    {
      icon: FileSignature,
      title: 'Visa Processing',
      description: 'Complete visa processing services with expert guidance through embassy interviews and document requirements.',
    },
    {
      icon: Shield,
      title: 'Document Processing',
      description: 'Complete visa forms, embassy documents & application filling services with accuracy guarantee.',
    },
  ];
  
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Student, UK',
      content: 'Esteetade made my dream of studying in the UK a reality. Their team handled everything professionally and kept me updated throughout.',
      rating: 5,
    },
    {
      name: 'Michael Chen',
      role: 'Software Engineer, Canada',
      content: 'Got my work visa through Esteetade in record time. The agent referral system is brilliant and the support is exceptional.',
      rating: 5,
    },
    {
      name: 'Amara Okafor',
      role: 'Business Owner',
      content: 'Their flight and hotel booking services saved me thousands of naira. Highly recommend for both personal and business travel.',
      rating: 5,
    },
  ];
  
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 gradient-hero" />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 100, 0], y: [0, -50, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -80, 0], y: [0, 80, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-20 right-10 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-3xl"
          />
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm mb-6"
              >
                <Star className="w-4 h-4 text-[#d4af37]" />
                Trusted by 10,000+ travelers worldwide
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
              >
                Your Global Travel{' '}
                <span className="text-[#d4af37]">& Visa Partner</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-lg sm:text-xl text-white/80 mb-8 max-w-lg"
              >
                Study abroad, work abroad, visa processing, flight booking and CV creation — all in one premium travel portal.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link to="/register">
                  <Button size="lg" className="bg-white text-[#0a9396] hover:bg-white/90 px-8 py-6 text-lg font-semibold btn-shine">
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg">
                    Sign In
                  </Button>
                </Link>
              </motion.div>
              
              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-12 flex items-center gap-6"
              >
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0a9396] to-[#005f73] border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                      U{i}
                    </div>
                  ))}
                </div>
                <div className="text-white/80 text-sm">
                  <span className="font-semibold text-white">500+</span> applications processed this month
                </div>
              </motion.div>
            </motion.div>
            
            {/* Hero Image/Illustration */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="hidden lg:block relative"
            >
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-10"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/20 to-[#0a9396]/20 rounded-3xl transform rotate-3" />
                  <img
                    src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80"
                    alt="Travel"
                    className="relative rounded-3xl shadow-2xl w-full"
                  />
                  
                  {/* Floating Cards */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">Visa Approved</div>
                        <div className="text-xs text-slate-500">Just now</div>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 }}
                    className="absolute -top-4 -right-4 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-xl"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-[#0a9396]" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">50+ Countries</span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2"
          >
            <motion.div className="w-1.5 h-1.5 rounded-full bg-white" />
          </motion.div>
        </motion.div>
      </section>
      
      {/* Stats Section */}
      <section id="about" ref={statsRef} className="py-20 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={statsInView ? 'visible' : 'hidden'}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12"
          >
            <StatCard value="10K+" label="Happy Clients" icon={Users} />
            <StatCard value="50+" label="Countries" icon={Globe} />
            <StatCard value="98%" label="Success Rate" icon={CheckCircle} />
            <StatCard value="24/7" label="Support" icon={Shield} />
          </motion.div>
        </div>
      </section>
      
      {/* Services Section */}
      <section id="services" ref={servicesRef} className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={servicesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-[#0a9396]/10 text-[#0a9396] text-sm font-medium mb-4">
              Our Services
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Everything You Need for <span className="text-[#0a9396]">Global Travel</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              From visa processing to flight bookings, we provide comprehensive travel services to make your journey seamless.
            </p>
          </motion.div>
          
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={servicesInView ? 'visible' : 'hidden'}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {services.map((service) => (
              <ServiceCard key={service.title} {...service} />
            ))}
          </motion.div>
        </div>
      </section>
      
      {/* Process Section */}
      <section ref={processRef} className="py-24 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={processInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-[#d4af37]/10 text-[#d4af37] text-sm font-medium mb-4">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Simple <span className="text-[#0a9396]">4-Step</span> Process
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Getting started with Esteetade is easy. Follow these simple steps to begin your journey.
            </p>
          </motion.div>
          
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={processInView ? 'visible' : 'hidden'}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            <ProcessStep number="1" title="Create Account" description="Sign up as a client or agent in just a few clicks" />
            <ProcessStep number="2" title="Choose Service" description="Select from our wide range of travel services" />
            <ProcessStep number="3" title="Submit Documents" description="Upload required documents securely" />
            <ProcessStep number="4" title="Track Progress" description="Monitor your application status in real-time" />
          </motion.div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section ref={testimonialsRef} className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-[#0a9396]/10 text-[#0a9396] text-sm font-medium mb-4">
              Testimonials
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              What Our <span className="text-[#d4af37]">Clients Say</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Don't just take our word for it. Here's what our satisfied clients have to say about their experience.
            </p>
          </motion.div>
          
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={testimonialsInView ? 'visible' : 'hidden'}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.name} {...testimonial} />
            ))}
          </motion.div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section id="contact" ref={ctaRef} className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Start Your <span className="text-[#d4af37]">Journey?</span>
            </h2>
            <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied clients who have achieved their travel dreams with Esteetade Travels.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="bg-white text-[#0a9396] hover:bg-white/90 px-8 py-6 text-lg font-semibold btn-shine">
                  Create Free Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg">
                  Already a Member?
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
