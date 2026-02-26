import mongoose from 'mongoose';
import dotenv from 'dotenv';

import User from '../models/User.js';
import Job from '../models/Job.js';
import Challenge from '../models/Challenge.js';
import Product from '../models/Product.js';
import Advertisement from '../models/Advertisement.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trampohero';

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Job.deleteMany({}),
      Challenge.deleteMany({}),
      Product.deleteMany({}),
      Advertisement.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // --- Users ---
    const users = await User.create([
      { name: 'Alex Silva', email: 'alex@trampo.com', password: 'password123', role: 'freelancer', niche: 'Gastronomia', rating: 4.8, tier: 'Pro', trampoCoins: { balance: 250, streak: 15 } },
      { name: 'Mariana Costa', email: 'mariana@trampo.com', password: 'password123', role: 'freelancer', niche: 'Gastronomia', rating: 4.9, trampoCoins: { balance: 180, streak: 10 } },
      { name: 'Carlos Oliveira', email: 'carlos@trampo.com', password: 'password123', role: 'freelancer', niche: 'Construção', rating: 5.0, trampoCoins: { balance: 320, streak: 20 } },
      { name: 'Fernanda Lima', email: 'fernanda@trampo.com', password: 'password123', role: 'freelancer', niche: 'Eventos', rating: 4.8, trampoCoins: { balance: 150, streak: 8 } },
      { name: 'João Kleber', email: 'joao@trampo.com', password: 'password123', role: 'freelancer', niche: 'Serviços Gerais', rating: 4.7, trampoCoins: { balance: 90, streak: 5 } },
      { name: 'Ana Souza', email: 'ana@trampo.com', password: 'password123', role: 'freelancer', niche: 'Gastronomia', rating: 5.0, trampoCoins: { balance: 400, streak: 25 } },
      { name: 'Pedro Santos', email: 'pedro@trampo.com', password: 'password123', role: 'freelancer', niche: 'Construção', rating: 4.6, trampoCoins: { balance: 75, streak: 3 } },
      { name: 'Buffet Delícia', email: 'buffet@trampo.com', password: 'password123', role: 'employer', niche: 'Gastronomia', rating: 4.8 },
      { name: 'Construtora Forte', email: 'construtora@trampo.com', password: 'password123', role: 'employer', niche: 'Construção', rating: 4.2 },
    ]);
    console.log(`👥 Created ${users.length} users`);

    const employer1 = users.find(u => u.name === 'Buffet Delícia');
    const employer2 = users.find(u => u.name === 'Construtora Forte');

    // --- Jobs ---
    const jobs = await Job.create([
      {
        employerId: employer1._id, title: 'Garçom de Gala (URGENTE)', employer: employer1.name, employerRating: 4.8,
        niche: 'Gastronomia', location: 'Av. Paulista, 1000 - SP', coordinates: { lat: -23.5614, lng: -46.6559 },
        payment: 180, paymentType: 'dia', description: 'Traje social próprio exigido para recepção de gala.',
        date: new Date().toISOString().split('T')[0], startTime: '18:00', status: 'open', isBoosted: true, isEscrowGuaranteed: true, minRatingRequired: 4.5,
      },
      {
        employerId: employer2._id, title: 'Ajudante de Reforma', employer: employer2.name, employerRating: 4.2,
        niche: 'Construção', location: 'Rua Augusta, 500 - SP', coordinates: { lat: -23.5505, lng: -46.6333 },
        payment: 120, paymentType: 'dia', description: 'Auxílio geral em obra civil leve.',
        date: new Date().toISOString().split('T')[0], startTime: '08:00', status: 'open', minRatingRequired: 3.5,
      },
      {
        employerId: employer1._id, title: 'Limpeza Pós-Evento', employer: employer1.name, employerRating: 4.8,
        niche: 'Serviços Gerais', location: 'Consolação, SP', coordinates: { lat: -23.5550, lng: -46.6600 },
        payment: 150, paymentType: 'job', description: 'Limpeza fina após casamento.',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0], startTime: '02:00', status: 'open', isEscrowGuaranteed: true, minRatingRequired: 4.0,
      },
    ]);
    console.log(`💼 Created ${jobs.length} jobs`);

    // --- Challenges ---
    const now = new Date();
    const challenges = await Challenge.create([
      {
        title: '🔥 Desafio da Semana', description: 'Complete 3 trampos esta semana', icon: 'fa-fire',
        reward: { type: 'cash', value: 30 }, requirement: { type: 'jobs_completed', target: 3 },
        startDate: new Date(now.getTime() - 2 * 86400000), endDate: new Date(now.getTime() + 5 * 86400000), isActive: true,
      },
      {
        title: '👥 Influenciador Hero', description: 'Indique 2 amigos e ganhe medalha exclusiva', icon: 'fa-users',
        reward: { type: 'medal', value: 'm-influencer' }, requirement: { type: 'referrals', target: 2 },
        startDate: new Date(now.getTime() - 2 * 86400000), endDate: new Date(now.getTime() + 5 * 86400000), isActive: true,
      },
      {
        title: '⭐ Estrela da Qualidade', description: 'Mantenha avaliação acima de 4.5 por 7 dias', icon: 'fa-star',
        reward: { type: 'coins', value: 50 }, requirement: { type: 'rating_maintained', target: 7 },
        startDate: new Date(now.getTime() - 3 * 86400000), endDate: new Date(now.getTime() + 4 * 86400000), isActive: true,
      },
    ]);
    console.log(`🏆 Created ${challenges.length} challenges`);

    // --- Products ---
    const products = await Product.create([
      { name: 'Kit Garçom Profissional', category: 'uniform', price: 89.90, originalPrice: 129.90, description: 'Conjunto completo: camisa, calça e gravata social', inStock: true, relatedNiches: ['Gastronomia', 'Eventos'], rating: 4.7, reviewCount: 124 },
      { name: 'Capacete de Segurança', category: 'epi', price: 45.00, description: 'Capacete certificado CA 31469', inStock: true, relatedNiches: ['Construção'], rating: 4.9, reviewCount: 89 },
      { name: 'Kit Limpeza Premium', category: 'tools', price: 129.90, originalPrice: 169.90, description: 'Mop profissional, produtos e acessórios', inStock: true, relatedNiches: ['Serviços Gerais'], rating: 4.8, reviewCount: 67 },
      { name: 'Mochila Organizadora', category: 'accessories', price: 69.90, description: 'Mochila impermeável para equipamentos', inStock: true, relatedNiches: ['Gastronomia', 'Construção', 'Eventos', 'Serviços Gerais'], rating: 4.6, reviewCount: 156 },
      { name: 'Luvas Anticorte', category: 'epi', price: 29.90, description: 'Luvas nível 5 de proteção', inStock: true, relatedNiches: ['Construção'], rating: 4.8, reviewCount: 201 },
      { name: 'Sapato Antiderrapante', category: 'uniform', price: 119.90, description: 'Sapato profissional para gastronomia', inStock: false, relatedNiches: ['Gastronomia'], rating: 4.9, reviewCount: 178 },
    ]);
    console.log(`🛒 Created ${products.length} products`);

    // --- Advertisements ---
    const ads = await Advertisement.create([
      {
        advertiserId: employer1._id, advertiserName: 'Banco Digital Hero', type: 'banner',
        content: { title: '💳 Cartão sem anuidade', description: 'Cashback de 2% em todas as compras. Abra sua conta grátis!', ctaText: 'Abrir Conta', ctaUrl: 'https://bancohero.com.br' },
        targeting: { niches: ['Gastronomia', 'Construção', 'Eventos', 'Serviços Gerais'], userActivity: 'high' },
        budget: 2000, spent: 1250, impressions: 45230, clicks: 892,
        startDate: new Date(now.getTime() - 7 * 86400000), endDate: new Date(now.getTime() + 23 * 86400000), isActive: true,
      },
      {
        advertiserId: employer2._id, advertiserName: 'EPI Shop', type: 'sponsored_post',
        content: { title: '🛡️ EPIs com até 50% OFF', description: 'Segurança é investimento! Confira nossa seleção especial.', ctaText: 'Ver Ofertas', ctaUrl: 'https://epishop.com.br' },
        targeting: { niches: ['Construção'], userActivity: 'medium' },
        budget: 500, spent: 320, impressions: 12500, clicks: 245,
        startDate: new Date(now.getTime() - 3 * 86400000), endDate: new Date(now.getTime() + 11 * 86400000), isActive: true,
      },
    ]);
    console.log(`📢 Created ${ads.length} advertisements`);

    console.log('\n✅ Seed completed successfully!');
    console.log(`Total: ${users.length} users, ${jobs.length} jobs, ${challenges.length} challenges, ${products.length} products, ${ads.length} ads`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedData();
