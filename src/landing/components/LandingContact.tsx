import React, { useState } from 'react';
import { 
  Mail, 
  Clock, 
  Shield, 
  MessageSquare, 
  CheckCircle, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  PhoneCall,
  Calendar,
  X,
  Send
} from 'lucide-react';
import { sendContactEmail, ContactFormData } from '../../services/contactService';

const BUSINESS_TYPES = [
  'Retail Store',
  'Restaurant',
  'Café',
  'Pharmacy',
  'Clothing Store',
  'Electronics Shop',
  'Warehouse',
  'Wholesale',
  'Supermarket',
  'Salon',
  'Other'
];

const LandingContact: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    businessName: '',
    businessType: '',
    email: '',
    phone: '',
    city: '',
    branches: '',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalState, setModalState] = useState<'none' | 'success' | 'error'>('none');
  const [errorMessage, setErrorMessage] = useState('');

  const validate = () => {
    const newErrors: Partial<Record<keyof ContactFormData, string>> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.businessName.trim()) newErrors.businessName = 'Business Name is required';
    if (!formData.businessType) newErrors.businessType = 'Business Type is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email Address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name as keyof ContactFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    setErrors({});
    
    const { success, error } = await sendContactEmail(formData);
    
    setIsSubmitting(false);
    
    if (success) {
      setModalState('success');
      // Reset form
      setFormData({
        fullName: '', businessName: '', businessType: '', email: '', phone: '', city: '', branches: '', subject: '', message: ''
      });
    } else {
      setErrorMessage(error || 'Something went wrong while sending your message.');
      setModalState('error');
    }
  };

  return (
    <section id="contact" className="lp-section-lg relative z-10 overflow-hidden bg-slate-50">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="lp-container relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          
          {/* LEFT SIDE: Company Info */}
          <div className="lg:col-span-5 lp-animate-fade-up">
            <h2 className="lp-heading-lg mb-6 text-slate-900">Let's Talk About Your Business</h2>
            <p className="lp-body-lg text-slate-600 mb-10">
              Whether you're looking for a modern POS system, inventory management, or a complete business management solution, we'd love to learn about your business and show how Counter Pro can help.
            </p>

            <div className="grid gap-4 mb-10">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex items-start space-x-4">
                <div className="bg-blue-50 text-blue-600 p-3 rounded-xl shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">Email Support</h4>
                  <a href="mailto:abuh68653@gmail.com" className="text-lg font-medium text-blue-600 hover:text-blue-700 transition-colors">
                    abuh68653@gmail.com
                  </a>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex items-start space-x-4">
                <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">Business Hours</h4>
                  <p className="text-slate-600 font-medium">Monday - Friday: 9AM - 6PM</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
                  <MessageSquare size={20} className="text-slate-400 mb-3" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Response Time</h4>
                  <p className="text-slate-600 font-medium text-sm">Within 24 Hours</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
                  <PhoneCall size={20} className="text-slate-400 mb-3" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Support</h4>
                  <p className="text-slate-600 font-medium text-sm">24/7 Dedicated</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 rounded-2xl p-6 border border-slate-200 mb-10 text-center">
               <p className="text-slate-700 font-medium">Every inquiry is personally reviewed by our product specialists.</p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Counter Pro Guarantees</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                {[
                  'Secure Communication',
                  'Fast Responses',
                  'Business Consultation',
                  'Product Demonstration Available'
                ].map((badge, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                    <span className="text-sm font-semibold text-slate-700">{badge}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Contact Form */}
          <div className="lg:col-span-7 relative lp-animate-fade-up lp-delay-200">
            {/* Form Glow */}
            <div className="absolute inset-0 bg-white/40 blur-2xl rounded-[3rem] pointer-events-none"></div>
            
            <div className="relative lp-glass-strong rounded-[2.5rem] border border-slate-200 shadow-2xl p-8 md:p-10">
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 2 Column Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Full Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={`w-full px-4 py-3 bg-white border ${errors.fullName ? 'border-red-400 focus:ring-red-400' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'} rounded-xl focus:ring-2 outline-none transition-all`}
                      placeholder="Jane Doe"
                    />
                    {errors.fullName && <p className="text-xs text-red-500 font-medium animate-fadeIn">{errors.fullName}</p>}
                  </div>

                  {/* Business Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Business Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={`w-full px-4 py-3 bg-white border ${errors.businessName ? 'border-red-400 focus:ring-red-400' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'} rounded-xl focus:ring-2 outline-none transition-all`}
                      placeholder="Acme Retail"
                    />
                    {errors.businessName && <p className="text-xs text-red-500 font-medium animate-fadeIn">{errors.businessName}</p>}
                  </div>

                  {/* Business Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Business Type <span className="text-red-500">*</span></label>
                    <select 
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={`w-full px-4 py-3 bg-white border ${errors.businessType ? 'border-red-400 focus:ring-red-400' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'} rounded-xl focus:ring-2 outline-none transition-all appearance-none`}
                    >
                      <option value="" disabled>Select your industry</option>
                      {BUSINESS_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {errors.businessType && <p className="text-xs text-red-500 font-medium animate-fadeIn">{errors.businessType}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email Address <span className="text-red-500">*</span></label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={`w-full px-4 py-3 bg-white border ${errors.email ? 'border-red-400 focus:ring-red-400' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'} rounded-xl focus:ring-2 outline-none transition-all`}
                      placeholder="hello@example.com"
                    />
                    {errors.email && <p className="text-xs text-red-500 font-medium animate-fadeIn">{errors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Phone Number</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 rounded-xl outline-none transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">City</label>
                    <input 
                      type="text" 
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 rounded-xl outline-none transition-all"
                      placeholder="New York"
                    />
                  </div>

                  {/* Branches */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Number of Branches</label>
                    <select 
                      name="branches"
                      value={formData.branches}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 rounded-xl outline-none transition-all appearance-none"
                    >
                      <option value="">Select an option</option>
                      <option value="1">1 (Single Store)</option>
                      <option value="2-5">2 - 5 Branches</option>
                      <option value="6-10">6 - 10 Branches</option>
                      <option value="11+">11+ Branches</option>
                    </select>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Subject <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={`w-full px-4 py-3 bg-white border ${errors.subject ? 'border-red-400 focus:ring-red-400' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'} rounded-xl focus:ring-2 outline-none transition-all`}
                      placeholder="How can we help?"
                    />
                    {errors.subject && <p className="text-xs text-red-500 font-medium animate-fadeIn">{errors.subject}</p>}
                  </div>

                  {/* Message */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Message <span className="text-red-500">*</span></label>
                    <textarea 
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      rows={4}
                      className={`w-full px-4 py-3 bg-white border ${errors.message ? 'border-red-400 focus:ring-red-400' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'} rounded-xl focus:ring-2 outline-none transition-all resize-none`}
                      placeholder="Tell us about your requirements..."
                    />
                    {errors.message && <p className="text-xs text-red-500 font-medium animate-fadeIn">{errors.message}</p>}
                  </div>

                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold flex items-center justify-center transition-all shadow-lg shadow-blue-500/20"
                  >
                    {isSubmitting ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send size={18} className="ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>

      {/* SUCCESS MODAL */}
      {modalState === 'success' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalState('none')}></div>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative z-10 shadow-2xl animate-fadeIn text-center">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="animate-[lp-shimmer_1s_ease-out]" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Message Sent Successfully!</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Thank you for contacting Counter Pro. We've received your inquiry and will review it carefully. Our team will get back to you as soon as possible.
            </p>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-8">
              <p className="text-sm font-semibold text-slate-700">Expected response time:</p>
              <p className="text-sm text-slate-500">Within one business day.</p>
            </div>
            <button 
              onClick={() => setModalState('none')}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
            >
              Return to Website
            </button>
          </div>
        </div>
      )}

      {/* ERROR MODAL */}
      {modalState === 'error' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalState('none')}></div>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative z-10 shadow-2xl animate-fadeIn text-center">
            <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600" onClick={() => setModalState('none')}>
              <X size={20} />
            </button>
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Something went wrong</h3>
            <p className="text-slate-600 mb-8 leading-relaxed">
              We couldn't send your message at this time. Please try again. If the issue persists, email us directly.
              <br/><br/>
              <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">{errorMessage}</span>
            </p>
            <button 
              onClick={() => setModalState('none')}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

    </section>
  );
};

export default LandingContact;
