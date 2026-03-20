import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applySeoMeta } from '../utils/seo';
import { analyticsService } from '../services/analyticsService';

describe('SEO metadata helpers', () => {
  beforeEach(() => {
    document.head.innerHTML = `
      <title>Initial</title>
      <meta name="description" content="initial description">
      <meta property="og:title" content="initial og title">
      <meta property="og:description" content="initial og description">
      <meta property="og:url" content="https://app.trampohero.com.br/">
      <meta property="og:image" content="https://app.trampohero.com.br/icons/icon-512.png">
      <meta name="twitter:title" content="initial twitter title">
      <meta name="twitter:description" content="initial twitter description">
      <meta name="twitter:image" content="https://app.trampohero.com.br/icons/icon-512.png">
      <link rel="canonical" href="https://app.trampohero.com.br/">
    `;
  });

  it('updates title, description and canonical by app view', () => {
    applySeoMeta('dashboard');

    expect(document.title).toContain('Painel de contratação');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain(
      'Publique vagas temporárias'
    );
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(
      'https://app.trampohero.com.br/empresas'
    );
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://app.trampohero.com.br/empresas'
    );
  });
});

describe('analytics service', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.gtag = vi.fn();
  });

  it('tracks page views in dataLayer and gtag', () => {
    analyticsService.trackPageView('/empresas', { role: 'employer' });

    expect(window.dataLayer).toHaveLength(1);
    expect(window.dataLayer?.[0]).toMatchObject({
      event: 'page_view',
      page_path: '/empresas',
      role: 'employer',
    });
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'page_view',
      expect.objectContaining({ page_path: '/empresas' })
    );
  });

  it('tracks custom events in dataLayer and gtag', () => {
    analyticsService.trackEvent('cta_empresa_criar_vaga_click', { source_view: 'dashboard' });

    expect(window.dataLayer?.[0]).toMatchObject({
      event: 'cta_empresa_criar_vaga_click',
      source_view: 'dashboard',
    });
    expect(window.gtag).toHaveBeenCalledWith('event', 'cta_empresa_criar_vaga_click', {
      source_view: 'dashboard',
    });
  });
});
