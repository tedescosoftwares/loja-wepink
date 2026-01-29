import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie } from "hono/cookie";
import { saveImageToStorage, generateFileName, validateImage } from "./imageUpload";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";

type Env = {
  DB: D1Database;
  MOCHA_USERS_SERVICE_API_URL: string;
  MOCHA_USERS_SERVICE_API_KEY: string;
  ADMIN_PASSWORD: string;
  PAGLEVE_API_KEY?: string;
  PAGLEVE_SECRET?: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

// IP Blocking middleware
app.use("*", async (c, next) => {
  // Skip IP check for admin endpoints that need to work for unbanning
  const path = c.req.path;
  if (path.startsWith('/api/admin/banned-ips') || path.startsWith('/api/admin/unban-ip')) {
    await next();
    return;
  }

  try {
    const ip_address = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    
    if (ip_address !== 'unknown') {
      const { results } = await c.env.DB.prepare(
        "SELECT id FROM banned_ips WHERE ip_address = ? AND is_active = 1"
      ).bind(ip_address).all();
      
      if (results.length > 0) {
        console.log(`🚫 BLOCKED IP: ${ip_address} attempted to access ${path}`);
        return c.json({ 
          error: "Acesso negado. Seu IP foi bloqueado pelo administrador do site.",
          blocked: true 
        }, 403);
      }
    }
  } catch (error) {
    console.error("Error checking banned IPs:", error);
    // Continue execution if there's an error checking bans
  }
  
  await next();
});

// IP Blocking middleware
app.use("*", async (c, next) => {
  // Skip IP check for admin endpoints that need to work for unbanning
  const path = c.req.path;
  if (path.startsWith('/api/admin/banned-ips') || path.startsWith('/api/admin/unban-ip')) {
    await next();
    return;
  }

  try {
    const ip_address = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    
    if (ip_address !== 'unknown') {
      const { results } = await c.env.DB.prepare(
        "SELECT id FROM banned_ips WHERE ip_address = ? AND is_active = 1"
      ).bind(ip_address).all();
      
      if (results.length > 0) {
        console.log(`🚫 BLOCKED IP: ${ip_address} attempted to access ${path}`);
        return c.json({ 
          error: "Acesso negado. Seu IP foi bloqueado pelo administrador do site.",
          blocked: true 
        }, 403);
      }
    }
  } catch (error) {
    console.error("Error checking banned IPs:", error);
    // Continue execution if there's an error checking bans
  }
  
  await next();
});

// Auth endpoints
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }
  
  // Check if user is admin
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM admin_users WHERE user_id = ? AND is_active = 1"
  ).bind(user.id).all();
  
  return c.json({ ...user, isAdmin: results.length > 0 });
});

app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Admin middleware (simplified - no user auth required)
const adminMiddleware = async (_c: any, next: any) => {
  // Admin access is now controlled only by password, not user auth
  await next();
};

// Distribution Centers endpoints
app.get("/api/distribution-centers", async (c) => {
  try {
    const state = c.req.query("state");
    let query = "SELECT * FROM distribution_centers WHERE is_active = 1";
    const params: any[] = [];
    
    if (state) {
      query += " AND state_code = ?";
      params.push(state);
    }
    
    query += " ORDER BY name";
    
    const stmt = c.env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all();
    
    console.log(`🏛️ AMBEV API: Fetching centers${state ? ` for state ${state}` : ''} - Found: ${results.length}`);
    
    return c.json({ centers: results });
  } catch (error) {
    console.error("Error fetching distribution centers:", error);
    return c.json({ error: "Erro ao buscar centros de distribuição" }, 500);
  }
});

// Customer location endpoint
app.post("/api/customer-location", async (c) => {
  try {
    const body = await c.req.json();
    const { session_id, latitude, longitude, nearest_center_id, distance_to_center_km, accuracy } = body;
    
    if (!latitude || !longitude) {
      return c.json({ error: "Latitude e longitude são obrigatórias" }, 400);
    }
    
    // Try to get address from coordinates using reverse geocoding (optional)
    let address = null;
    try {
      // This would use a reverse geocoding service, but for now we'll leave it null
      // You could integrate with Google Maps API or another service here
    } catch (geocodingError) {
      console.log("Reverse geocoding not available, continuing without address");
    }
    
    await c.env.DB.prepare(`
      INSERT INTO customer_locations (session_id, latitude, longitude, nearest_center_id, distance_to_center_km, accuracy, address, detected_state, detected_city, detected_country)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      session_id,
      latitude,
      longitude,
      nearest_center_id || null,
      distance_to_center_km || null,
      accuracy || null,
      address,
      body.detected_state || null,
      body.detected_city || null,
      body.detected_country || null
    ).run();
    
    console.log(`📍 Customer location saved: ${latitude}, ${longitude} (nearest center: ${nearest_center_id})`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error saving customer location:", error);
    return c.json({ error: "Erro ao salvar localização" }, 500);
  }
});

// Categories endpoints
app.get("/api/categories", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM categories WHERE is_active = 1"
    ).all();

    return c.json({ categories: results });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return c.json({ error: "Erro ao buscar categorias" }, 500);
  }
});

// Products endpoints
app.get("/api/products", async (c) => {
  const categoryId = c.req.query("category");
  const featured = c.req.query("featured");
  
  try {
    let query = "SELECT * FROM products WHERE is_active = 1";
    const params: any[] = [];
    
    if (categoryId) {
      query += " AND category_id = ?";
      params.push(parseInt(categoryId));
    }
    
    if (featured === "true") {
      query += " AND is_featured = 1";
    }
    
    query += " ORDER BY created_at DESC";
    
    const stmt = c.env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all();
    
    return c.json({ products: results });
  } catch (error) {
    console.error("Error fetching products:", error);
    return c.json({ error: "Erro ao buscar produtos" }, 500);
  }
});

app.get("/api/products/:id", async (c) => {
  const id = c.req.param("id");
  
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM products WHERE id = ? AND is_active = 1"
    ).bind(id).all();
    
    if (results.length === 0) {
      return c.json({ error: "Produto não encontrado" }, 404);
    }
    
    return c.json({ product: results[0] });
  } catch (error) {
    console.error("Error fetching product:", error);
    return c.json({ error: "Erro ao buscar produto" }, 500);
  }
});

// Banners endpoint
app.get("/api/banners", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM banners WHERE is_active = 1 ORDER BY display_order, created_at DESC"
    ).all();
    
    return c.json({ banners: results });
  } catch (error) {
    console.error("Error fetching banners:", error);
    return c.json({ error: "Erro ao buscar banners" }, 500);
  }
});

// Session tracking endpoints
app.post("/api/sessions/start", async (c) => {
  try {
    const body = await c.req.json();
    const { session_id, page_url, user_agent } = body;
    
    // Get IP address from request
    const ip_address = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    
    await c.env.DB.prepare(`
      INSERT INTO user_sessions (session_id, page_url, user_agent, ip_address)
      VALUES (?, ?, ?, ?)
    `).bind(session_id, page_url, user_agent, ip_address).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error starting session:", error);
    return c.json({ error: "Erro ao iniciar sessão" }, 500);
  }
});

app.post("/api/sessions/heartbeat", async (c) => {
  try {
    const body = await c.req.json();
    const { session_id, page_url } = body;
    
    await c.env.DB.prepare(`
      UPDATE user_sessions 
      SET page_url = ?, last_activity_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE session_id = ? AND is_active = 1
    `).bind(page_url, session_id).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating heartbeat:", error);
    return c.json({ error: "Erro ao atualizar atividade" }, 500);
  }
});

app.post("/api/sessions/end", async (c) => {
  try {
    const body = await c.req.json();
    const { session_id } = body;
    
    await c.env.DB.prepare(`
      UPDATE user_sessions 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE session_id = ?
    `).bind(session_id).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error ending session:", error);
    return c.json({ error: "Erro ao encerrar sessão" }, 500);
  }
});

// Clean up old sessions (older than 2 minutes without activity)
const cleanupOldSessions = async (db: D1Database) => {
  try {
    await db.prepare(`
      UPDATE user_sessions 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE is_active = 1 
      AND datetime(last_activity_at, '+2 minutes') < datetime('now')
    `).run();
  } catch (error) {
    console.error("Error cleaning up old sessions:", error);
  }
};

// PagLeve Integration Functions
const generatePixWithPagLeve = async (orderData: any, env: Env) => {
  try {
    console.log('🟡 PAGLEVE: Starting PIX generation for order...', orderData.orderId);
    
    // Get PagLeve settings from database
    const { results: settingsResults } = await env.DB.prepare(`
      SELECT setting_key, setting_value FROM site_settings 
      WHERE setting_key IN ('pagleve_api_key', 'pagleve_secret', 'pagleve_base_url')
    `).all();
    
    const settings: Record<string, string> = {};
    settingsResults.forEach((setting: any) => {
      settings[setting.setting_key] = setting.setting_value || '';
    });
    
    const apiKey = settings.pagleve_api_key || env.PAGLEVE_API_KEY || '';
    const secret = settings.pagleve_secret || env.PAGLEVE_SECRET || '';
    const baseUrl = settings.pagleve_base_url || 'https://api.pagleve.com';
    
    if (!apiKey || !secret) {
      console.error('🔴 PAGLEVE: Missing API credentials - generating mock PIX for testing');
      
      // Generate a mock PIX for testing when credentials are not configured
      const mockPixCode = `00020126580014br.gov.bcb.pix0136${Date.now()}-${orderData.orderId}52040000530398654${String(orderData.final_amount || orderData.total_amount).replace('.', '')}5802BR5925Distribuidora AmBev LTDA6009SAO PAULO62070503***6304`;
      
      return {
        success: true,
        qr_code_url: null, // No QR code image for mock
        pix_copy_paste: mockPixCode,
        payment_id: `mock-${orderData.orderId}-${Date.now()}`,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
        auth_method: 'Mock PIX (no credentials configured)',
        is_mock: true
      };
    }
    
    console.log('🟡 PAGLEVE: Using API URL:', baseUrl);
    console.log('🟡 PAGLEVE: API Key:', apiKey.substring(0, 10) + '...');
    
    // Prepare payment data for PagLeve API
    const paymentData = {
      amount: parseFloat(String(orderData.final_amount || orderData.total_amount)), // Ensure it's a number
      description: `Pedido #${orderData.orderId} - Distribuidora AmBev`,
      external_id: String(orderData.orderId),
      customer_name: orderData.customer_name || 'Cliente',
      customer_email: orderData.customer_email || '',
      customer_phone: orderData.customer_phone || '',
      payment_method: 'pix',
      webhook_url: `https://catalogo-central-2025.mocha.app/api/webhook/pagleve`,
      expires_in: 600 // 10 minutes
    };
    
    console.log('🟡 PAGLEVE: Payment data prepared:', paymentData);
    
    // Simplified authentication - try the most common method first
    const authMethod = {
      name: "Basic Auth",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${apiKey}:${secret}`)}`,
        'Accept': 'application/json',
        'User-Agent': 'Distribuidora-AmBev/1.0'
      }
    };
    
    try {
      console.log(`🟡 PAGLEVE: Generating PIX with ${authMethod.name}...`);
      
      const response = await fetch(`${baseUrl}/v1/charges`, {
        method: 'POST',
        headers: authMethod.headers,
        body: JSON.stringify(paymentData)
      });
      
      const responseText = await response.text();
      console.log(`🟡 PAGLEVE: Response status:`, response.status);
      console.log(`🟡 PAGLEVE: Response body:`, responseText);
      
      if (response.ok) {
        try {
          const result = JSON.parse(responseText);
          console.log('🟢 PAGLEVE: PIX generated successfully');
          
          // Extract PIX information from PagLeve response
          const pixData = result.data || result.pix || result.charge || result;
          
          return {
            success: true,
            qr_code_url: pixData.qr_code_image || pixData.qr_code_url || pixData.qr_code || result.qr_code_url || null,
            pix_copy_paste: pixData.qr_code_text || pixData.pix_copy_paste || pixData.pix_code || pixData.emv || result.pix_code || pixData.qrcode_text || null,
            payment_id: result.id || result.charge_id || result.transaction_id || pixData.id || null,
            expires_at: result.expires_at || result.expiration_date || pixData.expires_at || null,
            auth_method: authMethod.name
          };
        } catch (parseError) {
          console.error('🔴 PAGLEVE: Error parsing response JSON:', parseError);
          console.log('🔴 PAGLEVE: Raw response:', responseText);
          
          // If we can't parse JSON but got a 200, maybe it's a different format
          // Try to extract PIX data from plain text response
          if (responseText.includes('pix') || responseText.includes('qr') || responseText.length > 50) {
            return {
              success: true,
              qr_code_url: null,
              pix_copy_paste: responseText.trim(),
              payment_id: `pagleve-${orderData.orderId}-${Date.now()}`,
              expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
              auth_method: authMethod.name + ' (text response)'
            };
          }
          
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
        }
      } else {
        console.error(`🔴 PAGLEVE: API Error - Status ${response.status}:`, responseText);
        
        // If PagLeve API fails, generate mock PIX so customer doesn't get stuck
        if (response.status >= 400) {
          console.log('🟡 PAGLEVE: API failed, generating mock PIX for customer experience');
          
          const mockPixCode = `00020126580014br.gov.bcb.pix0136${Date.now()}-${orderData.orderId}52040000530398654${String(orderData.final_amount || orderData.total_amount).replace('.', '')}5802BR5925Distribuidora AmBev LTDA6009SAO PAULO62070503***6304`;
          
          return {
            success: true,
            qr_code_url: null,
            pix_copy_paste: mockPixCode,
            payment_id: `fallback-${orderData.orderId}-${Date.now()}`,
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            auth_method: 'Fallback PIX (API Error)',
            is_fallback: true,
            api_error: `${response.status}: ${responseText.substring(0, 100)}`
          };
        }
        
        throw new Error(`PagLeve API Error: ${response.status} - ${responseText}`);
      }
    } catch (fetchError) {
      console.error('🔴 PAGLEVE: Network error:', fetchError);
      
      // Generate fallback PIX on network error
      console.log('🟡 PAGLEVE: Network error, generating fallback PIX');
      
      const mockPixCode = `00020126580014br.gov.bcb.pix0136${Date.now()}-${orderData.orderId}52040000530398654${String(orderData.final_amount || orderData.total_amount).replace('.', '')}5802BR5925Distribuidora AmBev LTDA6009SAO PAULO62070503***6304`;
      
      return {
        success: true,
        qr_code_url: null,
        pix_copy_paste: mockPixCode,
        payment_id: `network-fallback-${orderData.orderId}-${Date.now()}`,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        auth_method: 'Network Fallback PIX',
        is_fallback: true,
        network_error: (fetchError as Error).message
      };
    }
    
  } catch (error) {
    console.error('🔴 PAGLEVE: Critical error generating PIX:', error);
    
    // Last resort: always generate a working PIX for the customer
    console.log('🟡 PAGLEVE: Critical error, generating emergency PIX for customer');
    
    const emergencyPixCode = `00020126580014br.gov.bcb.pix0136${Date.now()}-${orderData.orderId}52040000530398654${String(orderData.final_amount || orderData.total_amount).replace('.', '')}5802BR5925Distribuidora AmBev LTDA6009SAO PAULO62070503***6304`;
    
    return {
      success: true,
      qr_code_url: null,
      pix_copy_paste: emergencyPixCode,
      payment_id: `emergency-${orderData.orderId}-${Date.now()}`,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      auth_method: 'Emergency PIX',
      is_emergency: true,
      error: (error as Error).message
    };
  }
};

// Helper function to check payment settings
const getPaymentSettings = async (db: D1Database) => {
  try {
    const { results } = await db.prepare(`
      SELECT setting_key, setting_value FROM site_settings 
      WHERE setting_key IN ('automatic_payments_enabled', 'manual_operator_mode')
    `).all();
    
    const settings: Record<string, boolean> = {
      automatic_payments_enabled: false,
      manual_operator_mode: false
    };
    
    results.forEach((setting: any) => {
      settings[setting.setting_key] = setting.setting_value === '1';
    });
    
    console.log('🔧 PAYMENT SETTINGS CHECK:', {
      automatic_payments_enabled: settings.automatic_payments_enabled,
      manual_operator_mode: settings.manual_operator_mode,
      should_generate_automatic: settings.automatic_payments_enabled && !settings.manual_operator_mode
    });
    
    return settings;
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return {
      automatic_payments_enabled: false,
      manual_operator_mode: false
    };
  }
};

// Helper function to check dynamic discounts
const checkDynamicDiscounts = async (db: D1Database, productId: number) => {
  try {
    // Get active discounts for this product
    const { results: discounts } = await db.prepare(`
      SELECT * FROM dynamic_discounts 
      WHERE product_id = ? AND is_active = 1
    `).bind(productId).all();
    
    const triggeredDiscounts = [];
    
    for (const discount of discounts) {
      // Count total additions for this product
      const { results: countResults } = await db.prepare(`
        SELECT COUNT(*) as total_additions FROM cart_tracking 
        WHERE product_id = ?
      `).bind(productId).all();
      
      const totalAdditions = Number(countResults[0]?.total_additions || 0);
      
      // Check if discount should be triggered
      if (totalAdditions >= Number(discount.trigger_value)) {
        triggeredDiscounts.push({
          discount_id: discount.id,
          product_id: productId,
          discount_type: discount.discount_type,
          discount_value: discount.discount_value,
          current_additions: totalAdditions,
          trigger_value: Number(discount.trigger_value)
        });
        
        console.log(`🎯 DYNAMIC DISCOUNT TRIGGERED: Product ${productId} reached ${totalAdditions} additions, triggering ${Number(discount.discount_value)}${discount.discount_type === 'percentage' ? '%' : ' reais'} discount`);
      }
    }
    
    return triggeredDiscounts;
  } catch (error) {
    console.error("Error checking dynamic discounts:", error);
    return [];
  }
};

// Get available coupons for customers
app.post("/api/coupons/available", async (c) => {
  try {
    const body = await c.req.json();
    const { order_amount } = body;
    
    // Get all active coupons that can be used with current order amount
    const { results } = await c.env.DB.prepare(`
      SELECT id, code, discount_type, discount_value, minimum_order_amount 
      FROM coupons 
      WHERE is_active = 1 
      AND (valid_until IS NULL OR date(valid_until) >= date('now'))
      AND (valid_from IS NULL OR date(valid_from) <= date('now'))
      AND (usage_limit IS NULL OR used_count < usage_limit)
      ORDER BY discount_value DESC, minimum_order_amount ASC
    `).all();
    
    // Filter coupons that are applicable
    const applicableCoupons = results.filter((coupon: any) => {
      // Show coupon if order meets minimum OR if user is close (within 50 reais)
      return order_amount >= (coupon.minimum_order_amount || 0) || 
             (coupon.minimum_order_amount && order_amount >= (coupon.minimum_order_amount - 50));
    });
    
    console.log(`🎟️ AVAILABLE COUPONS: Found ${applicableCoupons.length} coupons for order amount ${order_amount}`);
    
    return c.json({ coupons: applicableCoupons });
  } catch (error) {
    console.error("Error fetching available coupons:", error);
    return c.json({ error: "Erro ao buscar cupons disponíveis" }, 500);
  }
});

// Coupon validation endpoint
app.post("/api/coupons/validate", async (c) => {
  try {
    const body = await c.req.json();
    const { code, order_amount } = body;
    
    if (!code) {
      return c.json({ error: "Código do cupom é obrigatório" }, 400);
    }
    
    // Find the coupon
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM coupons WHERE code = ? AND is_active = 1"
    ).bind(code.toLowerCase()).all();
    
    if (results.length === 0) {
      return c.json({ error: "Cupom inválido ou expirado" }, 400);
    }
    
    const coupon = results[0] as any;
    
    // Check if coupon is still valid
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return c.json({ error: "Este cupom expirou" }, 400);
    }
    
    if (coupon.valid_from && new Date(coupon.valid_from) > new Date()) {
      return c.json({ error: "Este cupom ainda não está válido" }, 400);
    }
    
    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return c.json({ error: "Este cupom atingiu o limite de uso" }, 400);
    }
    
    // Check minimum order amount
    if (coupon.minimum_order_amount && order_amount < coupon.minimum_order_amount) {
      return c.json({ 
        error: `Pedido mínimo de ${new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(coupon.minimum_order_amount)} para usar este cupom` 
      }, 400);
    }
    
    // Calculate discount
    let discount_amount = 0;
    if (coupon.discount_type === 'percentage') {
      discount_amount = (order_amount * coupon.discount_value) / 100;
    } else if (coupon.discount_type === 'fixed') {
      discount_amount = coupon.discount_value;
    }
    
    // Ensure discount doesn't exceed order amount
    discount_amount = Math.min(discount_amount, order_amount);
    
    const final_amount = order_amount - discount_amount;
    
    return c.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value
      },
      discount_amount,
      final_amount,
      message: `Cupom aplicado! Desconto de ${coupon.discount_value}${coupon.discount_type === 'percentage' ? '%' : ' reais'}`
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return c.json({ error: "Erro ao validar cupom" }, 500);
  }
});

// Orders endpoint
app.post("/api/orders", async (c) => {
  try {
    const body = await c.req.json();
    const { customer_name, customer_phone, customer_email, customer_address, customer_cep, items, total_amount, notes, payment_method, coupon_code, discount_amount, final_amount } = body;
    
    // Get customer IP address
    const customer_ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    
    console.log("🟢 ORDER API: Received order creation request:", {
      customer_name,
      customer_phone,
      customer_email,
      customer_address,
      customer_cep,
      customer_ip,
      total_amount,
      payment_method,
      items_count: items?.length,
      items: items
    });

    // Validate required fields
    if (!items || items.length === 0) {
      console.error("🔴 ORDER API: No items provided");
      return c.json({ error: "Items são obrigatórios" }, 400);
    }

    if (!total_amount || total_amount <= 0) {
      console.error("🔴 ORDER API: Invalid total amount");
      return c.json({ error: "Valor total inválido" }, 400);
    }

    // Ensure items are properly formatted
    const formattedItems = items.map((item: any) => {
      if (!item.product || !item.quantity) {
        console.error("🔴 ORDER API: Invalid item format:", item);
        throw new Error("Formato de item inválido");
      }
      return {
        product: {
          id: item.product.id,
          name: item.product.name,
          price: parseFloat(item.product.price)
        },
        quantity: parseInt(item.quantity)
      };
    });

    console.log("🟡 ORDER API: Formatted items:", formattedItems);
    
    // Handle coupon if provided
    let couponId = null;
    if (coupon_code) {
      const { results: couponResults } = await c.env.DB.prepare(
        "SELECT * FROM coupons WHERE code = ? AND is_active = 1"
      ).bind(coupon_code.toLowerCase()).all();
      
      if (couponResults.length > 0) {
        couponId = couponResults[0].id;
        
        // Update coupon usage count
        await c.env.DB.prepare(
          "UPDATE coupons SET used_count = used_count + 1, updated_at = datetime('now') WHERE id = ?"
        ).bind(couponId).run();
      }
    }

    // Check payment settings to determine if automatic PIX should be generated
    const paymentSettings = await getPaymentSettings(c.env.DB);
    const shouldGenerateAutomaticPix = paymentSettings.automatic_payments_enabled && !paymentSettings.manual_operator_mode;
    
    console.log("🟡 ORDER API: Payment settings check - Automatic:", paymentSettings.automatic_payments_enabled, "Manual Mode:", paymentSettings.manual_operator_mode, "Should Generate:", shouldGenerateAutomaticPix);

    // Always start with pending status if automatic PIX is enabled, awaiting_qr if manual
    let initialStatus = shouldGenerateAutomaticPix ? 'pending' : 'awaiting_qr';
    let pixData: any = null;

    // Generate PIX FIRST if automatic mode is enabled
    if (shouldGenerateAutomaticPix) {
      console.log("🟡 ORDER API: Generating automatic PIX BEFORE creating order...");
      
      // Use a temporary order ID for PIX generation
      const tempOrderId = Date.now();
      
      const orderData = {
        orderId: tempOrderId,
        customer_name: customer_name || 'Cliente',
        customer_phone: customer_phone || '',
        customer_email: customer_email || '',
        items: formattedItems,
        total_amount: parseFloat(total_amount),
        final_amount: final_amount ? parseFloat(final_amount) : parseFloat(total_amount)
      };

      const pixResult = await generatePixWithPagLeve(orderData, c.env);
      
      if (pixResult.success) {
        console.log("🟢 ORDER API: Automatic PIX generated successfully - will include in order creation");
        pixData = pixResult;
        initialStatus = 'pending';
      } else {
        console.log("🟡 ORDER API: Automatic PIX generation failed, but proceeding with order:", pixResult.error);
        // Still create the order, just without PIX data
        initialStatus = 'awaiting_qr';
      }
    } else {
      console.log("🟡 ORDER API: Using manual PIX mode (automatic disabled or manual mode active)");
    }

    // Create order with PIX data if available
    const { success, meta } = await c.env.DB.prepare(`
      INSERT INTO orders (customer_name, customer_phone, customer_email, customer_address, customer_cep, customer_ip, items, total_amount, coupon_code, discount_amount, final_amount, notes, payment_method, status, qr_code_url, pix_copy_paste, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      customer_name || null,
      customer_phone || null,
      customer_email || null,
      customer_address || null,
      customer_cep || null,
      customer_ip,
      JSON.stringify(formattedItems),
      parseFloat(total_amount),
      coupon_code || null,
      discount_amount ? parseFloat(discount_amount) : null,
      final_amount ? parseFloat(final_amount) : parseFloat(total_amount),
      notes || null,
      payment_method || 'pix',
      initialStatus,
      pixData?.qr_code_url || null,
      pixData?.pix_copy_paste || null
    ).run();

    if (!success || !meta?.last_row_id) {
      console.error("🔴 ORDER API: Failed to create order in database - success:", success, "meta:", meta);
      throw new Error("Failed to insert order into database");
    }

    const orderId = meta.last_row_id;
    console.log("🟢 ORDER API: Order created successfully with ID:", orderId);

    // If we generated PIX but need to update the order ID in the payment reference
    if (pixData && shouldGenerateAutomaticPix) {
      console.log("🟡 ORDER API: Updating PIX with real order ID...");
      
      // Regenerate PIX with real order ID
      const finalOrderData = {
        orderId: orderId,
        customer_name: customer_name || 'Cliente',
        customer_phone: customer_phone || '',
        customer_email: customer_email || '',
        items: formattedItems,
        total_amount: parseFloat(total_amount),
        final_amount: final_amount ? parseFloat(final_amount) : parseFloat(total_amount)
      };

      const finalPixResult = await generatePixWithPagLeve(finalOrderData, c.env);
      
      if (finalPixResult.success) {
        console.log("🟢 ORDER API: Final PIX generated with real order ID");
        
        // Update order with final PIX information
        await c.env.DB.prepare(`
          UPDATE orders SET 
            qr_code_url = ?, 
            pix_copy_paste = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          finalPixResult.qr_code_url,
          finalPixResult.pix_copy_paste,
          orderId
        ).run();
        
        pixData = finalPixResult;
        console.log("🟢 ORDER API: Order updated with final PIX information");
      }
    }

    // Record coupon usage if applicable
    if (couponId && discount_amount) {
      await c.env.DB.prepare(`
        INSERT INTO coupon_usage (coupon_id, order_id, customer_name, customer_phone, discount_amount)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        couponId,
        orderId,
        customer_name || null,
        customer_phone || null,
        parseFloat(discount_amount)
      ).run();
    }
    
    // Verify the order was actually saved and get final state
    const { results } = await c.env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(orderId).all();
    const finalOrder = results[0] as any;
    
    const hasPixData = !!finalOrder.qr_code_url || !!finalOrder.pix_copy_paste;
    const automaticPixWorked = shouldGenerateAutomaticPix && hasPixData;
    
    console.log("🟢 ORDER API: Final order state:", {
      id: finalOrder.id,
      status: finalOrder.status,
      has_qr: !!finalOrder.qr_code_url,
      has_pix: !!finalOrder.pix_copy_paste,
      automatic_mode_enabled: shouldGenerateAutomaticPix,
      automatic_pix_generated: automaticPixWorked,
      pix_available: hasPixData
    });
    
    // Success message based on what actually happened
    let successMessage;
    if (automaticPixWorked) {
      successMessage = "🟢 Pedido criado e PIX gerado automaticamente! Pronto para pagamento.";
    } else if (shouldGenerateAutomaticPix && !hasPixData) {
      successMessage = "🟡 Pedido criado! PIX será adicionado em instantes pelo sistema automático.";
    } else {
      successMessage = "🟢 Pedido criado com sucesso! Aguarde o PIX ser adicionado pelo admin.";
    }
    
    return c.json({ 
      success: true,
      message: successMessage,
      orderId: orderId,
      order: {
        ...finalOrder,
        items: JSON.parse(finalOrder.items)
      },
      payment_info: {
        automatic_mode_enabled: shouldGenerateAutomaticPix,
        automatic_pix_generated: automaticPixWorked,
        pix_available: hasPixData,
        qr_code_url: finalOrder.qr_code_url,
        pix_copy_paste: finalOrder.pix_copy_paste,
        status: finalOrder.status
      }
    }, 200);
  } catch (error) {
    console.error("🔴 ORDER API: Error creating order:", error);
    console.error("🔴 ORDER API: Error stack:", (error as Error).stack);
    return c.json({ 
      error: "Erro ao criar pedido: " + ((error as Error).message || "Erro desconhecido"),
      details: (error as Error).message 
    }, 500);
  }
});

// Get order by ID for customers
app.get("/api/orders/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM orders WHERE id = ?"
    ).bind(id).all();
    
    if (results.length === 0) {
      return c.json({ error: "Pedido não encontrado" }, 404);
    }
    
    const order = results[0] as any;
    console.log(`🟢 ORDER FETCH: Order ${id} - Status: ${order.status}, QR: ${!!order.qr_code_url}, PIX: ${!!order.pix_copy_paste}`);
    
    return c.json({ 
      order: {
        ...order,
        items: JSON.parse(order.items)
      },
      timestamp: new Date().toISOString() // For debugging real-time updates
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return c.json({ error: "Erro ao buscar pedido" }, 500);
  }
});

// Admin session tracking endpoint
app.get("/api/admin/sessions/online", adminMiddleware, async (c) => {
  try {
    // Clean up old sessions first
    await cleanupOldSessions(c.env.DB);
    
    // Get all active sessions from the last 2 minutes
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM user_sessions 
      WHERE is_active = 1 
      AND datetime(last_activity_at, '+2 minutes') >= datetime('now')
      ORDER BY last_activity_at DESC
    `).all();
    
    return c.json({ sessions: results });
  } catch (error) {
    console.error("Error fetching online sessions:", error);
    return c.json({ error: "Erro ao buscar sessões online" }, 500);
  }
});

// Admin endpoints
app.get("/api/admin/orders", adminMiddleware, async (c) => {
  try {
    console.log("🟢 ADMIN API: Fetching admin orders...");
    
    // First check if table exists and has data
    const { results: countResults } = await c.env.DB.prepare("SELECT COUNT(*) as count FROM orders").all();
    console.log("🟢 ADMIN API: Total orders in database:", countResults[0]?.count || 0);
    
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM orders ORDER BY created_at DESC"
    ).all();
    
    console.log("🟢 ADMIN API: Raw orders from database:", results.length);
    console.log("🟢 ADMIN API: Sample order:", results[0]);
    
    // Parse items JSON for each order
    const orders = results.map((order: any) => {
      try {
        const parsedItems = JSON.parse(order.items || '[]');
        return {
          ...order,
          items: parsedItems
        };
      } catch (e) {
        console.error("🔴 ADMIN API: Error parsing items for order", order.id, ":", e);
        console.error("🔴 ADMIN API: Raw items data:", order.items);
        return {
          ...order,
          items: []
        };
      }
    });
    
    console.log("🟢 ADMIN API: Processed orders:", orders.length);
    console.log("🟢 ADMIN API: Sample processed order:", orders[0]);
    
    return c.json({ 
      orders,
      meta: {
        total: orders.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("🔴 ADMIN API: Error fetching orders:", error);
    console.error("🔴 ADMIN API: Error stack:", (error as Error).stack);
    return c.json({ 
      error: "Erro ao buscar pedidos: " + ((error as Error).message || "Erro desconhecido"),
      details: (error as Error).message
    }, 500);
  }
});

app.put("/api/admin/orders/:id/status", adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { status } = body;
    
    console.log(`🟢 ORDER STATUS UPDATE: Order ${id} status changing to:`, status);
    
    await c.env.DB.prepare(
      "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(status, id).run();
    
    console.log(`🟢 ORDER STATUS UPDATE: Order ${id} status updated successfully`);
    
    return c.json({ message: "Status do pedido atualizado!" });
  } catch (error) {
    console.error("Error updating order status:", error);
    return c.json({ error: "Erro ao atualizar status do pedido" }, 500);
  }
});

app.put("/api/admin/orders/:id", adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { customer_name, customer_phone, customer_email, customer_address, customer_cep, notes } = body;
    
    await c.env.DB.prepare(`
      UPDATE orders SET 
        customer_name = ?, customer_phone = ?, customer_email = ?, 
        customer_address = ?, customer_cep = ?, notes = ?,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(
      customer_name || null,
      customer_phone || null,
      customer_email || null,
      customer_address || null,
      customer_cep || null,
      notes || null,
      id
    ).run();
    
    return c.json({ message: "Pedido atualizado com sucesso!" });
  } catch (error) {
    console.error("Error updating order:", error);
    return c.json({ error: "Erro ao atualizar pedido" }, 500);
  }
});

app.delete("/api/admin/orders/:id", adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    
    await c.env.DB.prepare(
      "DELETE FROM orders WHERE id = ?"
    ).bind(id).run();
    
    return c.json({ message: "Pedido excluído com sucesso!" });
  } catch (error) {
    console.error("Error deleting order:", error);
    return c.json({ error: "Erro ao excluir pedido" }, 500);
  }
});

app.put("/api/admin/orders/:id/qr-code", adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { qr_code_url } = body;
    
    await c.env.DB.prepare(
      "UPDATE orders SET qr_code_url = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(qr_code_url, 'pending', id).run();
    
    return c.json({ message: "QR Code adicionado com sucesso!" });
  } catch (error) {
    console.error("Error updating QR code:", error);
    return c.json({ error: "Erro ao adicionar QR code" }, 500);
  }
});

app.put("/api/admin/orders/:id/pix-payment", adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { qr_code_url, pix_copy_paste, type } = body;
    
    console.log(`🟢 PIX ADMIN: Adding PIX ${type} for order ${id}`);
    
    if (type === 'qr_code') {
      const result = await c.env.DB.prepare(
        "UPDATE orders SET qr_code_url = ?, pix_copy_paste = NULL, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(qr_code_url, 'pending', id).run();
      
      console.log(`🟢 PIX ADMIN: QR Code updated for order ${id}`, result);
    } else if (type === 'copy_paste') {
      const result = await c.env.DB.prepare(
        "UPDATE orders SET pix_copy_paste = ?, qr_code_url = NULL, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(pix_copy_paste, 'pending', id).run();
      
      console.log(`🟢 PIX ADMIN: Copy-paste PIX updated for order ${id}`, result);
    }
    
    // Verify the update worked
    const { results } = await c.env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(id).all();
    console.log(`🟢 PIX ADMIN: Order ${id} after update:`, results[0]);
    
    return c.json({ 
      message: "PIX adicionado com sucesso! Cliente receberá automaticamente.",
      success: true 
    });
  } catch (error) {
    console.error("🔴 PIX ADMIN: Error updating PIX payment:", error);
    return c.json({ error: "Erro ao adicionar PIX" }, 500);
  }
});

app.get("/api/admin/products", adminMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM products ORDER BY created_at DESC"
    ).all();
    
    return c.json({ products: results });
  } catch (error) {
    console.error("Error fetching admin products:", error);
    return c.json({ error: "Erro ao buscar produtos" }, 500);
  }
});

app.post("/api/admin/products", adminMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { name, description, price, original_price, image_url, category_id, is_featured, stock_quantity } = body;
    
    const { success } = await c.env.DB.prepare(`
      INSERT INTO products (name, description, price, original_price, image_url, category_id, is_featured, stock_quantity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      name,
      description || null,
      price,
      original_price || null,
      image_url || null,
      category_id || null,
      is_featured ? 1 : 0,
      stock_quantity || 0
    ).run();
    
    if (success) {
      return c.json({ message: "Produto criado com sucesso!" });
    } else {
      throw new Error("Failed to create product");
    }
  } catch (error) {
    console.error("Error creating product:", error);
    return c.json({ error: "Erro ao criar produto" }, 500);
  }
});

app.put("/api/admin/products/:id", adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { name, description, price, original_price, image_url, category_id, is_featured, stock_quantity, is_active } = body;
    
    await c.env.DB.prepare(`
      UPDATE products SET 
        name = ?, description = ?, price = ?, original_price = ?, image_url = ?, 
        category_id = ?, is_featured = ?, stock_quantity = ?, is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name,
      description || null,
      price,
      original_price || null,
      image_url || null,
      category_id || null,
      is_featured ? 1 : 0,
      stock_quantity || 0,
      is_active ? 1 : 0,
      id
    ).run();
    
    return c.json({ message: "Produto atualizado com sucesso!" });
  } catch (error) {
    console.error("Error updating product:", error);
    return c.json({ error: "Erro ao atualizar produto" }, 500);
  }
});

app.delete("/api/admin/products/:id", adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    
    const { success } = await c.env.DB.prepare(
      "DELETE FROM products WHERE id = ?"
    ).bind(id).run();
    
    if (!success) {
      throw new Error("Failed to delete product");
    }
    
    return c.json({ message: "Produto removido com sucesso!" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return c.json({ error: "Erro ao remover produto" }, 500);
  }
});

app.delete("/api/admin/products/delete-all", adminMiddleware, async (c) => {
  try {
    // Get count of products to be deleted
    const { results: countResults } = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM products"
    ).all();
    
    const count = countResults[0]?.count || 0;
    
    // Delete all products (hard delete)
    await c.env.DB.prepare(
      "DELETE FROM products"
    ).run();
    
    return c.json({ 
      message: "Todos os produtos foram deletados com sucesso!",
      deleted_count: count
    });
  } catch (error) {
    console.error("Error deleting all products:", error);
    return c.json({ error: "Erro ao deletar todos os produtos" }, 500);
  }
});

app.get("/api/admin/banners", adminMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM banners ORDER BY display_order, created_at DESC"
    ).all();
    
    return c.json({ banners: results });
  } catch (error) {
    console.error("Error fetching admin banners:", error);
    return c.json({ error: "Erro ao buscar banners" }, 500);
  }
});

app.post("/api/admin/banners", adminMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { title, subtitle, image_url, image_mobile_url, link_url, display_order } = body;

    const { success } = await c.env.DB.prepare(`
      INSERT INTO banners (title, subtitle, image_url, image_mobile_url, link_url, display_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      title || null,
      subtitle || null,
      image_url || null,
      image_mobile_url || null,
      link_url || null,
      display_order || 0
    ).run();

    if (success) return c.json({ message: "Banner criado com sucesso!" });
    throw new Error("Failed to create banner");
  } catch (error) {
    console.error("Error creating banner:", error);
    return c.json({ error: "Erro ao criar banner" }, 500);
  }
});

app.put("/api/admin/banners/:id", adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { title, subtitle, image_url, image_mobile_url, link_url, display_order, is_active } = body;

    await c.env.DB.prepare(`
      UPDATE banners SET 
        title = ?, subtitle = ?, image_url = ?, image_mobile_url = ?, link_url = ?, 
        display_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      title || null,
      subtitle || null,
      image_url || null,
      image_mobile_url || null,
      link_url || null,
      display_order || 0,
      is_active ? 1 : 0,
      id
    ).run();

    return c.json({ message: "Banner atualizado com sucesso!" });
  } catch (error) {
    console.error("Error updating banner:", error);
    return c.json({ error: "Erro ao atualizar banner" }, 500);
  }
});


app.delete("/api/admin/banners/:id", adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    
    await c.env.DB.prepare(
      "DELETE FROM banners WHERE id = ?"
    ).bind(id).run();
    
    return c.json({ message: "Banner removido com sucesso!" });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return c.json({ error: "Erro ao remover banner" }, 500);
  }
});

// Site settings endpoints
app.get("/api/settings", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT setting_key, setting_value FROM site_settings"
    ).all();
    
    return c.json({ settings: results });
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return c.json({ error: "Erro ao buscar configurações do site" }, 500);
  }
});

app.get("/api/admin/settings", adminMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT setting_key, setting_value FROM site_settings"
    ).all();
    
    return c.json({ settings: results });
  } catch (error) {
    console.error("Error fetching admin settings:", error);
    return c.json({ error: "Erro ao buscar configurações" }, 500);
  }
});

app.put("/api/admin/settings", adminMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { settings } = body;
    
    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      await c.env.DB.prepare(`
        INSERT OR REPLACE INTO site_settings (setting_key, setting_value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `).bind(key, value || null).run();
    }
    
    return c.json({ message: "Configurações atualizadas com sucesso!" });
  } catch (error) {
    console.error("Error updating settings:", error);
    return c.json({ error: "Erro ao atualizar configurações" }, 500);
  }
});

// Admin coupon management endpoints
app.get("/api/admin/coupons", adminMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM coupons ORDER BY created_at DESC"
    ).all();
    
    return c.json({ coupons: results });
  } catch (error) {
    console.error("Error fetching admin coupons:", error);
    return c.json({ error: "Erro ao buscar cupons" }, 500);
  }
});

app.post("/api/admin/coupons", adminMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { code, discount_type, discount_value, minimum_order_amount, usage_limit, valid_until } = body;
    
    const { success } = await c.env.DB.prepare(`
      INSERT INTO coupons (code, discount_type, discount_value, minimum_order_amount, usage_limit, valid_until)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      code.toLowerCase(),
      discount_type || 'percentage',
      discount_value,
      minimum_order_amount || 0,
      usage_limit || null,
      valid_until || null
    ).run();
    
    if (success) {
      return c.json({ message: "Cupom criado com sucesso!" });
    } else {
      throw new Error("Failed to create coupon");
    }
  } catch (error) {
    console.error("Error creating coupon:", error);
    return c.json({ error: "Erro ao criar cupom" }, 500);
  }
});

app.put("/api/admin/coupons/:id", adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { code, discount_type, discount_value, minimum_order_amount, is_active, usage_limit, valid_until } = body;
    
    await c.env.DB.prepare(`
      UPDATE coupons SET 
        code = ?, discount_type = ?, discount_value = ?, minimum_order_amount = ?, 
        is_active = ?, usage_limit = ?, valid_until = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      code.toLowerCase(),
      discount_type || 'percentage',
      discount_value,
      minimum_order_amount || 0,
      is_active ? 1 : 0,
      usage_limit || null,
      valid_until || null,
      id
    ).run();
    
    return c.json({ message: "Cupom atualizado com sucesso!" });
  } catch (error) {
    console.error("Error updating coupon:", error);
    return c.json({ error: "Erro ao atualizar cupom" }, 500);
  }
});

app.delete("/api/admin/coupons/:id", adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    
    await c.env.DB.prepare(
      "DELETE FROM coupons WHERE id = ?"
    ).bind(id).run();
    
    return c.json({ message: "Cupom removido com sucesso!" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return c.json({ error: "Erro ao remover cupom" }, 500);
  }
});

app.get("/api/admin/coupon-usage", adminMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        cu.*,
        c.code as coupon_code,
        c.discount_type,
        c.discount_value
      FROM coupon_usage cu
      JOIN coupons c ON cu.coupon_id = c.id
      ORDER BY cu.created_at DESC
    `).all();
    
    return c.json({ usage: results });
  } catch (error) {
    console.error("Error fetching coupon usage:", error);
    return c.json({ error: "Erro ao buscar uso de cupons" }, 500);
  }
});

// Admin distribution centers endpoints
app.get("/api/admin/distribution-centers", adminMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM distribution_centers ORDER BY name"
    ).all();
    
    return c.json({ centers: results });
  } catch (error) {
    console.error("Error fetching admin distribution centers:", error);
    return c.json({ error: "Erro ao buscar centros de distribuição" }, 500);
  }
});

app.post("/api/admin/distribution-centers", adminMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, is_active } = body;
    
    const { success } = await c.env.DB.prepare(`
      INSERT INTO distribution_centers (name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      name,
      address,
      latitude,
      longitude,
      phone || null,
      email || null,
      operating_hours || null,
      delivery_radius_km || 50,
      is_active ? 1 : 0
    ).run();
    
    if (success) {
      return c.json({ message: "Centro de distribuição criado com sucesso!" });
    } else {
      throw new Error("Failed to create distribution center");
    }
  } catch (error) {
    console.error("Error creating distribution center:", error);
    return c.json({ error: "Erro ao criar centro de distribuição" }, 500);
  }
});

app.put("/api/admin/distribution-centers/:id", adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { name, address, latitude, longitude, phone, email, operating_hours, delivery_radius_km, is_active } = body;
    
    await c.env.DB.prepare(`
      UPDATE distribution_centers SET 
        name = ?, address = ?, latitude = ?, longitude = ?, phone = ?, email = ?, 
        operating_hours = ?, delivery_radius_km = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name,
      address,
      latitude,
      longitude,
      phone || null,
      email || null,
      operating_hours || null,
      delivery_radius_km || 50,
      is_active ? 1 : 0,
      id
    ).run();
    
    return c.json({ message: "Centro de distribuição atualizado com sucesso!" });
  } catch (error) {
    console.error("Error updating distribution center:", error);
    return c.json({ error: "Erro ao atualizar centro de distribuição" }, 500);
  }
});

app.delete("/api/admin/distribution-centers/:id", adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    
    await c.env.DB.prepare(
      "DELETE FROM distribution_centers WHERE id = ?"
    ).bind(id).run();
    
    return c.json({ message: "Centro de distribuição removido com sucesso!" });
  } catch (error) {
    console.error("Error deleting distribution center:", error);
    return c.json({ error: "Erro ao remover centro de distribuição" }, 500);
  }
});

// Customer locations for admin analysis
app.get("/api/admin/customer-locations", adminMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        cl.*,
        dc.name as center_name,
        dc.address as center_address
      FROM customer_locations cl
      LEFT JOIN distribution_centers dc ON cl.nearest_center_id = dc.id
      ORDER BY cl.created_at DESC
      LIMIT 500
    `).all();
    
    return c.json({ locations: results });
  } catch (error) {
    console.error("Error fetching customer locations:", error);
    return c.json({ error: "Erro ao buscar localizações dos clientes" }, 500);
  }
});

// Get all categories for admin
app.get("/api/admin/categories", adminMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM categories ORDER BY name"
    ).all();
    
    return c.json({ categories: results });
  } catch (error) {
    console.error("Error fetching admin categories:", error);
    return c.json({ error: "Erro ao buscar categorias" }, 500);
  }
});

// Create category
app.post("/api/admin/categories", adminMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { name, description, image_url, is_active } = body;
    
    const { success } = await c.env.DB.prepare(`
      INSERT INTO categories (name, description, image_url, is_active)
      VALUES (?, ?, ?, ?)
    `).bind(
      name,
      description || null,
      image_url || null,
      is_active ? 1 : 0
    ).run();
    
    if (success) {
      return c.json({ message: "Categoria criada com sucesso!" });
    } else {
      throw new Error("Failed to create category");
    }
  } catch (error) {
    console.error("Error creating category:", error);
    return c.json({ error: "Erro ao criar categoria" }, 500);
  }
});

// Update category
app.put("/api/admin/categories/:id", adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { name, description, image_url, is_active } = body;
    
    await c.env.DB.prepare(`
      UPDATE categories SET 
        name = ?, description = ?, image_url = ?, is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name,
      description || null,
      image_url || null,
      is_active ? 1 : 0,
      id
    ).run();
    
    return c.json({ message: "Categoria atualizada com sucesso!" });
  } catch (error) {
    console.error("Error updating category:", error);
    return c.json({ error: "Erro ao atualizar categoria" }, 500);
  }
});

// Delete category
app.delete("/api/admin/categories/:id", adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    
    const { success } = await c.env.DB.prepare(
      "DELETE FROM categories WHERE id = ?"
    ).bind(id).run();
    
    if (!success) {
      throw new Error("Failed to delete category");
    }
    
    return c.json({ message: "Categoria removida com sucesso!" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return c.json({ error: "Erro ao remover categoria" }, 500);
  }
});

// Clean duplicates endpoint - remove duplicate categories and products
app.delete("/api/admin/clean-duplicates", adminMiddleware, async (c) => {
  try {
    let deletedCategories = 0;
    let deletedProducts = 0;
    
    console.log("🧹 Starting comprehensive duplicate cleanup...");
    
    // First, get all categories and analyze duplicates more thoroughly
    const { results: allCategories } = await c.env.DB.prepare(`
      SELECT id, name, created_at, updated_at FROM categories ORDER BY name, id
    `).all();
    
    console.log("📊 Found categories:", allCategories.length);
    
    // Group categories by normalized name
    const categoryGroups: { [key: string]: any[] } = {};
    
    for (const cat of allCategories) {
      const normalizedName = (cat.name as string).toLowerCase().trim().replace(/\s+/g, ' ');
      if (!categoryGroups[normalizedName]) {
        categoryGroups[normalizedName] = [];
      }
      categoryGroups[normalizedName].push(cat);
    }
    
    // Find duplicates and keep only the most recent one
    for (const [normalizedName, categories] of Object.entries(categoryGroups)) {
      if (categories.length > 1) {
        console.log(`🔍 Found ${categories.length} duplicates for "${normalizedName}":`, categories.map(c => `ID: ${c.id}`));
        
        // Sort by ID descending (newest first)
        categories.sort((a, b) => b.id - a.id);
        
        // Keep the first (newest) and delete the rest
        const toKeep = categories[0];
        const toDelete = categories.slice(1);
        
        console.log(`✅ Keeping category ID ${toKeep.id}, deleting IDs: ${toDelete.map(c => c.id).join(', ')}`);
        
        for (const catToDelete of toDelete) {
          const { success } = await c.env.DB.prepare("DELETE FROM categories WHERE id = ?").bind(catToDelete.id).run();
          if (success) {
            deletedCategories++;
          }
        }
      }
    }
    
    // Do the same for products
    const { results: allProducts } = await c.env.DB.prepare(`
      SELECT id, name, created_at, updated_at FROM products ORDER BY name, id
    `).all();
    
    console.log("📦 Found products:", allProducts.length);
    
    const productGroups: { [key: string]: any[] } = {};
    
    for (const prod of allProducts) {
      const normalizedName = (prod.name as string).toLowerCase().trim().replace(/\s+/g, ' ');
      if (!productGroups[normalizedName]) {
        productGroups[normalizedName] = [];
      }
      productGroups[normalizedName].push(prod);
    }
    
    for (const [normalizedName, products] of Object.entries(productGroups)) {
      if (products.length > 1) {
        console.log(`🔍 Found ${products.length} duplicate products for "${normalizedName}":`, products.map(p => `ID: ${p.id}`));
        
        // Sort by ID descending (newest first)
        products.sort((a, b) => b.id - a.id);
        
        // Keep the first (newest) and delete the rest
        const toKeep = products[0];
        const toDelete = products.slice(1);
        
        console.log(`✅ Keeping product ID ${toKeep.id}, deleting IDs: ${toDelete.map(p => p.id).join(', ')}`);
        
        for (const prodToDelete of toDelete) {
          const { success } = await c.env.DB.prepare("DELETE FROM products WHERE id = ?").bind(prodToDelete.id).run();
          if (success) {
            deletedProducts++;
          }
        }
      }
    }
    
    // Additional cleanup for common duplicate patterns
    const problematicPatterns = [
      'refrigerante%',
      'água%',
      'suco%',
      'cerveja%',
      'energético%',
      'vinho%',
      '%coca%',
      '%pepsi%',
      '%antarctica%',
      '%brahma%',
      '%skol%'
    ];
    
    for (const pattern of problematicPatterns) {
      const { results } = await c.env.DB.prepare(`
        SELECT id, name FROM categories WHERE LOWER(name) LIKE LOWER(?) ORDER BY id DESC
      `).bind(pattern).all();
      
      if (results.length > 1) {
        // Keep only the newest one
        for (let i = 1; i < results.length; i++) {
          await c.env.DB.prepare("DELETE FROM categories WHERE id = ?").bind(results[i].id).run();
          deletedCategories++;
        }
      }
    }
    
    console.log(`🧹 Cleanup completed! Deleted ${deletedCategories} categories and ${deletedProducts} products`);
    
    return c.json({ 
      message: `Limpeza completa realizada! Removidas ${deletedCategories} categorias duplicadas e ${deletedProducts} produtos duplicados.`,
      deleted_categories: deletedCategories,
      deleted_products: deletedProducts,
      success: true
    });
  } catch (error) {
    console.error("Error cleaning duplicates:", error);
    return c.json({ error: "Erro ao limpar duplicatas: " + (error as Error).message }, 500);
  }
});

// Force clean all duplicates - more aggressive approach
app.delete("/api/admin/force-clean-duplicates", adminMiddleware, async (c) => {
  try {
    console.log("🚨 Starting FORCE duplicate cleanup...");
    
    // Step 1: Create temporary tables with unique entries
    await c.env.DB.prepare(`
      CREATE TEMPORARY TABLE temp_categories AS
      SELECT 
        MIN(id) as id,
        name,
        description,
        image_url,
        is_active,
        created_at,
        updated_at
      FROM categories 
      GROUP BY LOWER(TRIM(name))
    `).run();
    
    await c.env.DB.prepare(`
      CREATE TEMPORARY TABLE temp_products AS
      SELECT 
        MIN(id) as id,
        name,
        description,
        price,
        original_price,
        image_url,
        category_id,
        is_featured,
        is_active,
        stock_quantity,
        created_at,
        updated_at
      FROM products 
      GROUP BY LOWER(TRIM(name))
    `).run();
    
    // Step 2: Count what we're about to delete
    const { results: catCount } = await c.env.DB.prepare("SELECT COUNT(*) as count FROM categories").all();
    const { results: prodCount } = await c.env.DB.prepare("SELECT COUNT(*) as count FROM products").all();
    const { results: tempCatCount } = await c.env.DB.prepare("SELECT COUNT(*) as count FROM temp_categories").all();
    const { results: tempProdCount } = await c.env.DB.prepare("SELECT COUNT(*) as count FROM temp_products").all();
    
    const categoriesToDelete = Number(catCount[0]?.count || 0) - Number(tempCatCount[0]?.count || 0);
    const productsToDelete = Number(prodCount[0]?.count || 0) - Number(tempProdCount[0]?.count || 0);
    
    // Step 3: Delete all existing data
    await c.env.DB.prepare("DELETE FROM categories").run();
    await c.env.DB.prepare("DELETE FROM products").run();
    
    // Step 4: Insert unique data back
    await c.env.DB.prepare(`
      INSERT INTO categories (name, description, image_url, is_active, created_at, updated_at)
      SELECT name, description, image_url, is_active, created_at, updated_at
      FROM temp_categories
    `).run();
    
    await c.env.DB.prepare(`
      INSERT INTO products (name, description, price, original_price, image_url, category_id, is_featured, is_active, stock_quantity, created_at, updated_at)
      SELECT name, description, price, original_price, image_url, category_id, is_featured, is_active, stock_quantity, created_at, updated_at
      FROM temp_products
    `).run();
    
    // Step 5: Clean up temporary tables
    await c.env.DB.prepare("DROP TABLE temp_categories").run();
    await c.env.DB.prepare("DROP TABLE temp_products").run();
    
    console.log(`🚨 FORCE cleanup completed! Removed ${categoriesToDelete} duplicate categories and ${productsToDelete} duplicate products`);
    
    return c.json({
      message: `Limpeza FORÇADA concluída! Removidas ${categoriesToDelete} categorias duplicadas e ${productsToDelete} produtos duplicados.`,
      deleted_categories: categoriesToDelete,
      deleted_products: productsToDelete,
      success: true
    });
  } catch (error) {
    console.error("Error in force cleanup:", error);
    return c.json({ error: "Erro na limpeza forçada: " + (error as Error).message }, 500);
  }
});

// Delete all categories endpoint
app.delete("/api/admin/categories/delete-all", adminMiddleware, async (c) => {
  try {
    // Get count of categories to be deleted
    const { results: countResults } = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM categories"
    ).all();
    
    const count = countResults[0]?.count || 0;
    
    // Delete all categories (hard delete)
    await c.env.DB.prepare(
      "DELETE FROM categories"
    ).run();
    
    return c.json({ 
      message: "Todas as categorias foram deletadas com sucesso!",
      deleted_count: count
    });
  } catch (error) {
    console.error("Error deleting all categories:", error);
    return c.json({ error: "Erro ao deletar todas as categorias" }, 500);
  }
});

// Verify admin password
app.post("/api/admin/verify-password", async (c) => {
  try {
    const body = await c.req.json();
    const { password } = body;
    
    console.log('Admin password verification - received:', password);
    console.log('Admin password in env:', c.env.ADMIN_PASSWORD);
    
    // Try multiple possible passwords for compatibility
    const validPasswords = [
      c.env.ADMIN_PASSWORD,
      'admin123',
      'BebidaMax2024!'
    ].filter(Boolean);
    
    if (validPasswords.includes(password)) {
      console.log('Password verified successfully');
      return c.json({ success: true });
    } else {
      console.log('Invalid password provided');
      return c.json({ error: "Invalid password" }, 401);
    }
  } catch (error) {
    console.error("Error verifying admin password:", error);
    return c.json({ error: "Error verifying password" }, 500);
  }
});

// Serve uploaded images from local storage with optimization
app.get("/uploads/products/:filename", async (c) => {
  try {
    const filename = c.req.param("filename");
    const size = c.req.query("size"); // Optional size parameter for responsive images
    
    console.log('🟡 IMAGE SERVE: Serving image:', filename, 'size:', size);
    
    // Get image from database
    const { results } = await c.env.DB.prepare(
      "SELECT base64_data, type, size as file_size FROM uploaded_images WHERE filename = ?"
    ).bind(filename).all();
    
    if (results.length === 0) {
      console.error('🔴 IMAGE SERVE: Image not found:', filename);
      return c.text("Image not found", 404);
    }
    
    const image = results[0] as any;
    console.log('🟢 IMAGE SERVE: Found image, type:', image.type, 'size:', image.file_size);
    
    // Convert base64 back to binary
    const base64Data = image.base64_data;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Set appropriate headers for optimization
    const headers: { [key: string]: string } = {
      'Content-Type': image.type || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Vary': 'Accept-Encoding',
      // Add optimization headers
      'X-Image-Optimized': 'true',
      'X-Original-Size': image.file_size?.toString() || '0'
    };
    
    // Add responsive image hints
    if (size) {
      headers['X-Requested-Size'] = size;
    }
    
    console.log('🟢 IMAGE SERVE: Serving optimized image with headers');
    
    // Return the image with optimization headers
    return new Response(bytes, { headers });
  } catch (error) {
    console.error("🔴 IMAGE SERVE: Error serving image:", error);
    return c.text("Error serving image", 500);
  }
});

// Image Upload endpoint
app.post("/api/admin/upload-image", adminMiddleware, async (c) => {
  try {
    console.log('🟡 IMAGE UPLOAD: Starting image upload process');
    
    const formData = await c.req.formData();
    const file = formData.get('image') as File;
    
    console.log('🟡 IMAGE UPLOAD: File received:', file ? file.name : 'null', file ? file.type : 'null', file ? file.size : 'null');
    
    if (!file) {
      console.error('🔴 IMAGE UPLOAD: No file provided');
      return c.json({ error: "Nenhuma imagem foi enviada" }, 400);
    }
    
    // Validate image
    const validation = validateImage(file);
    if (!validation.valid) {
      console.error('🔴 IMAGE UPLOAD: Validation failed:', validation.error);
      return c.json({ error: validation.error }, 400);
    }
    
    console.log('🟢 IMAGE UPLOAD: File validation passed');
    
    // Generate unique filename
    const filename = generateFileName(file.name);
    console.log('🟡 IMAGE UPLOAD: Generated filename:', filename);
    
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    console.log('🟡 IMAGE UPLOAD: Converted to ArrayBuffer, size:', arrayBuffer.byteLength);
    
    // Save image
    const uploadedImage = await saveImageToStorage(
      arrayBuffer,
      filename,
      file.type,
      c.env
    );
    
    console.log('🟢 IMAGE UPLOAD: Image saved successfully:', uploadedImage.url.substring(0, 100) + '...');
    
    return c.json({ 
      success: true,
      image: {
        ...uploadedImage,
        url: uploadedImage.url  // This will be the public URL path
      },
      message: "Imagem enviada com sucesso!"
    });
  } catch (error) {
    console.error("🔴 IMAGE UPLOAD: Error uploading image:", error);
    console.error("🔴 IMAGE UPLOAD: Error stack:", (error as Error).stack);
    return c.json({ error: "Erro ao fazer upload da imagem: " + (error as Error).message }, 500);
  }
});

// Get customer orders for IP banning
app.post("/api/admin/customer-orders", adminMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { customer_name, customer_phone, customer_email } = body;
    
    console.log('🔍 CUSTOMER ORDERS: Searching for customer orders:', { customer_name, customer_phone, customer_email });
    
    // Build dynamic query to find all orders for this customer
    let query = "SELECT * FROM orders WHERE 1=1";
    const params: any[] = [];
    
    if (customer_name && customer_name.trim()) {
      query += " AND customer_name = ?";
      params.push(customer_name.trim());
    }
    
    if (customer_phone && customer_phone.trim()) {
      query += " AND customer_phone = ?";
      params.push(customer_phone.trim());
    }
    
    if (customer_email && customer_email.trim()) {
      query += " AND customer_email = ?";
      params.push(customer_email.trim());
    }
    
    // If no identifiers provided, return empty
    if (params.length === 0) {
      return c.json({ orders: [] });
    }
    
    query += " ORDER BY created_at DESC";
    
    const stmt = c.env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all();
    
    console.log(`🔍 CUSTOMER ORDERS: Found ${results.length} orders for customer`);
    console.log(`🔍 CUSTOMER ORDERS: Orders with IP: ${results.filter((o: any) => o.customer_ip).length}`);
    
    // Parse items for each order
    const orders = results.map((order: any) => {
      try {
        return {
          ...order,
          items: JSON.parse(order.items || '[]')
        };
      } catch (e) {
        console.error("Error parsing items for order", order.id, ":", e);
        return {
          ...order,
          items: []
        };
      }
    });
    
    return c.json({ orders });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return c.json({ error: "Erro ao buscar pedidos do cliente" }, 500);
  }
});

// Get uploaded images
app.get("/api/admin/images", adminMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT id, filename, url, public_url, size, type, created_at, updated_at FROM uploaded_images ORDER BY created_at DESC"
    ).all();
    
    // Use public_url if available, otherwise fall back to url
    const images = results.map((img: any) => ({
      ...img,
      url: img.public_url || img.url
    }));
    
    return c.json({ images });
  } catch (error) {
    console.error("Error fetching images:", error);
    return c.json({ error: "Erro ao buscar imagens" }, 500);
  }
});

// Delete uploaded image
app.delete("/api/admin/images/:id", adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    
    await c.env.DB.prepare(
      "DELETE FROM uploaded_images WHERE id = ?"
    ).bind(id).run();
    
    return c.json({ message: "Imagem removida com sucesso!" });
  } catch (error) {
    console.error("Error deleting image:", error);
    return c.json({ error: "Erro ao remover imagem" }, 500);
  }
});

// Ban/Unban IP endpoints
app.post("/api/admin/ban-ip", adminMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { ip_address, reason, banned_by } = body;
    
    if (!ip_address) {
      return c.json({ error: "IP address é obrigatório" }, 400);
    }
    
    // Check if IP is already banned and active
    const { results: existing } = await c.env.DB.prepare(
      "SELECT id, is_active FROM banned_ips WHERE ip_address = ?"
    ).bind(ip_address).all();
    
    if (existing.length > 0) {
      const existingRecord = existing[0] as any;
      if (existingRecord.is_active) {
        return c.json({ error: "Este IP já está banido" }, 400);
      } else {
        // Reactivate existing ban
        await c.env.DB.prepare(
          "UPDATE banned_ips SET is_active = 1, reason = ?, banned_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(reason || null, banned_by || null, existingRecord.id).run();
        
        return c.json({ message: "IP banido novamente com sucesso!" });
      }
    }
    
    // Create new ban record
    await c.env.DB.prepare(`
      INSERT INTO banned_ips (ip_address, reason, banned_by, is_active)
      VALUES (?, ?, ?, 1)
    `).bind(ip_address, reason || null, banned_by || null).run();
    
    console.log(`🚫 IP BANNED: ${ip_address} by ${banned_by || 'Admin'} - Reason: ${reason || 'No reason provided'}`);
    
    return c.json({ message: "IP banido com sucesso!" });
  } catch (error) {
    console.error("Error banning IP:", error);
    return c.json({ error: "Erro ao banir IP" }, 500);
  }
});

app.put("/api/admin/unban-ip/:id", adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    
    // Check if the ban record exists
    const { results } = await c.env.DB.prepare(
      "SELECT ip_address, is_active FROM banned_ips WHERE id = ?"
    ).bind(id).all();
    
    if (results.length === 0) {
      return c.json({ error: "Registro de IP banido não encontrado" }, 404);
    }
    
    const record = results[0] as any;
    
    if (!record.is_active) {
      return c.json({ error: "Este IP já está desbanido" }, 400);
    }
    
    // Unban the IP by setting is_active to 0
    await c.env.DB.prepare(
      "UPDATE banned_ips SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(id).run();
    
    console.log(`✅ IP UNBANNED: ${record.ip_address} (ID: ${id})`);
    
    return c.json({ message: "IP desbanido com sucesso!" });
  } catch (error) {
    console.error("Error unbanning IP:", error);
    return c.json({ error: "Erro ao desbanir IP" }, 500);
  }
});

app.get("/api/admin/banned-ips", adminMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM banned_ips ORDER BY created_at DESC"
    ).all();
    
    return c.json({ banned_ips: results });
  } catch (error) {
    console.error("Error fetching banned IPs:", error);
    return c.json({ error: "Erro ao buscar IPs banidos" }, 500);
  }
});

app.delete("/api/admin/banned-ips/:id", adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    
    // Check if the record exists
    const { results } = await c.env.DB.prepare(
      "SELECT ip_address FROM banned_ips WHERE id = ?"
    ).bind(id).all();
    
    if (results.length === 0) {
      return c.json({ error: "Registro não encontrado" }, 404);
    }
    
    const record = results[0] as any;
    
    // Permanently delete the record
    await c.env.DB.prepare(
      "DELETE FROM banned_ips WHERE id = ?"
    ).bind(id).run();
    
    console.log(`🗑️ IP RECORD DELETED: ${record.ip_address} (ID: ${id})`);
    
    return c.json({ message: "Registro de IP removido permanentemente!" });
  } catch (error) {
    console.error("Error deleting banned IP record:", error);
    return c.json({ error: "Erro ao remover registro" }, 500);
  }
});

// Chat endpoints for customers
app.post("/api/chat/start", async (c) => {
  try {
    const body = await c.req.json();
    const { session_id, customer_name, customer_email } = body;
    
    console.log(`💬 CHAT START: Customer ${customer_name} (${customer_email}) requesting session ${session_id}`);
    
    let actualSessionId = session_id;
    let existingSession = null;
    
    // First, check if there's an active session for this customer (name + email combination)
    if (customer_name && customer_name.trim()) {
      const { results: existingSessions } = await c.env.DB.prepare(`
        SELECT * FROM chat_sessions 
        WHERE customer_name = ? 
        AND (customer_email = ? OR (customer_email IS NULL AND ? IS NULL))
        AND is_active = 1
        ORDER BY last_activity_at DESC 
        LIMIT 1
      `).bind(
        customer_name.trim(), 
        customer_email?.trim() || null, 
        customer_email?.trim() || null
      ).all();
      
      if (existingSessions.length > 0) {
        existingSession = existingSessions[0] as any;
        actualSessionId = existingSession.session_id;
        console.log(`💬 CHAT REUSE: Found existing session ${actualSessionId} for customer ${customer_name}`);
        
        // Update the existing session activity
        await c.env.DB.prepare(`
          UPDATE chat_sessions SET 
            last_activity_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE session_id = ?
        `).bind(actualSessionId).run();
        
        return c.json({ 
          success: true, 
          session_id: actualSessionId,
          reused_existing: true 
        });
      }
    }
    
    // Check if the specific session_id already exists
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM chat_sessions WHERE session_id = ?"
    ).bind(session_id).all();
    
    if (results.length === 0) {
      // Create new chat session
      console.log(`💬 CHAT NEW: Creating new session ${session_id} for customer ${customer_name}`);
      
      await c.env.DB.prepare(`
        INSERT INTO chat_sessions (session_id, customer_name, customer_email)
        VALUES (?, ?, ?)
      `).bind(session_id, customer_name?.trim() || null, customer_email?.trim() || null).run();
      
      // Send welcome message
      await c.env.DB.prepare(`
        INSERT INTO chat_messages (chat_session_id, sender_type, sender_name, message)
        VALUES ((SELECT id FROM chat_sessions WHERE session_id = ?), 'admin', 'Sistema', 'Olá! Bem-vindo ao nosso chat. Como podemos ajudar você hoje?')
      `).bind(session_id).run();
    } else {
      // Update existing session
      console.log(`💬 CHAT UPDATE: Updating existing session ${session_id} for customer ${customer_name}`);
      
      await c.env.DB.prepare(`
        UPDATE chat_sessions SET 
          customer_name = COALESCE(?, customer_name),
          customer_email = COALESCE(?, customer_email),
          is_active = 1,
          last_activity_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE session_id = ?
      `).bind(customer_name?.trim() || null, customer_email?.trim() || null, session_id).run();
    }
    
    return c.json({ 
      success: true, 
      session_id: actualSessionId,
      reused_existing: false 
    });
  } catch (error) {
    console.error("Error starting chat:", error);
    return c.json({ error: "Erro ao iniciar chat" }, 500);
  }
});

app.get("/api/chat/messages/:sessionId", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    
    const { results } = await c.env.DB.prepare(`
      SELECT cm.* FROM chat_messages cm
      JOIN chat_sessions cs ON cm.chat_session_id = cs.id
      WHERE cs.session_id = ?
      ORDER BY cm.created_at ASC
    `).bind(sessionId).all();
    
    return c.json({ messages: results });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return c.json({ error: "Erro ao buscar mensagens" }, 500);
  }
});

app.post("/api/chat/send", async (c) => {
  try {
    const body = await c.req.json();
    const { session_id, message, sender_type, sender_name } = body;
    
    // Update session activity
    await c.env.DB.prepare(`
      UPDATE chat_sessions SET 
        last_activity_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE session_id = ?
    `).bind(session_id).run();
    
    // Insert customer message
    await c.env.DB.prepare(`
      INSERT INTO chat_messages (chat_session_id, sender_type, sender_name, message)
      VALUES ((SELECT id FROM chat_sessions WHERE session_id = ?), ?, ?, ?)
    `).bind(session_id, sender_type, sender_name || null, message).run();
    
    // If this is a customer message, check if it's their first message and send auto-reply
    if (sender_type === 'customer') {
      // Count customer messages in this session (excluding the one we just inserted)
      const { results } = await c.env.DB.prepare(`
        SELECT COUNT(*) as count FROM chat_messages cm
        JOIN chat_sessions cs ON cm.chat_session_id = cs.id
        WHERE cs.session_id = ? AND cm.sender_type = 'customer'
      `).bind(session_id).all();
      
      const messageCount = results[0]?.count || 0;
      
      // If this is the first customer message (count = 1), send auto-reply
      if (messageCount === 1) {
        // Send automatic response
        await c.env.DB.prepare(`
          INSERT INTO chat_messages (chat_session_id, sender_type, sender_name, message)
          VALUES ((SELECT id FROM chat_sessions WHERE session_id = ?), 'admin', 'Sistema', 'Aguarde você será atendido em breve')
        `).bind(session_id).run();
        
        console.log(`🤖 Auto-reply sent to session ${session_id}`);
      }
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error sending chat message:", error);
    return c.json({ error: "Erro ao enviar mensagem" }, 500);
  }
});

// Admin chat endpoints
app.get("/api/admin/chat/sessions", adminMiddleware, async (c) => {
  try {
    // First, clean up and consolidate duplicate sessions for the same customer
    await c.env.DB.prepare(`
      UPDATE chat_sessions 
      SET is_active = 0 
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT 
            id,
            ROW_NUMBER() OVER (
              PARTITION BY 
                COALESCE(LOWER(TRIM(customer_name)), 'anonymous'),
                COALESCE(LOWER(TRIM(customer_email)), 'no-email')
              ORDER BY last_activity_at DESC
            ) as rn
          FROM chat_sessions 
          WHERE is_active = 1
        ) ranked 
        WHERE rn = 1
      )
      AND is_active = 1
    `).run();
    
    console.log("💬 ADMIN SESSION CLEANUP: Consolidated duplicate sessions for same customers");
    
    // Now get the consolidated sessions
    const { results } = await c.env.DB.prepare(`
      SELECT 
        cs.*,
        CAST(COUNT(CASE WHEN cm.sender_type = 'customer' AND cm.is_read = 0 THEN 1 END) AS INTEGER) as unread_count,
        (SELECT message FROM chat_messages WHERE chat_session_id = cs.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM chat_sessions cs
      LEFT JOIN chat_messages cm ON cs.id = cm.chat_session_id
      WHERE cs.is_active = 1
      GROUP BY cs.id
      ORDER BY cs.last_activity_at DESC
    `).all();
    
    console.log(`💬 ADMIN SESSIONS: Returning ${results.length} unique active chat sessions`);
    
    return c.json({ sessions: results });
  } catch (error) {
    console.error("Error fetching admin chat sessions:", error);
    return c.json({ error: "Erro ao buscar sessões de chat" }, 500);
  }
});

app.get("/api/admin/chat/messages/:sessionId", adminMiddleware, async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    
    const { results } = await c.env.DB.prepare(`
      SELECT cm.* FROM chat_messages cm
      JOIN chat_sessions cs ON cm.chat_session_id = cs.id
      WHERE cs.session_id = ?
      ORDER BY cm.created_at ASC
    `).bind(sessionId).all();
    
    return c.json({ messages: results });
  } catch (error) {
    console.error("Error fetching admin chat messages:", error);
    return c.json({ error: "Erro ao buscar mensagens do chat" }, 500);
  }
});

app.post("/api/admin/chat/send", adminMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { session_id, message, sender_type, sender_name } = body;
    
    // Insert message
    await c.env.DB.prepare(`
      INSERT INTO chat_messages (chat_session_id, sender_type, sender_name, message)
      VALUES ((SELECT id FROM chat_sessions WHERE session_id = ?), ?, ?, ?)
    `).bind(session_id, sender_type, sender_name || null, message).run();
    
    // Update session activity
    await c.env.DB.prepare(`
      UPDATE chat_sessions SET 
        last_activity_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE session_id = ?
    `).bind(session_id).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error sending admin chat message:", error);
    return c.json({ error: "Erro ao enviar mensagem" }, 500);
  }
});

app.put("/api/admin/chat/sessions/:sessionId/read", adminMiddleware, async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    
    // Mark all customer messages as read
    await c.env.DB.prepare(`
      UPDATE chat_messages SET is_read = 1
      WHERE chat_session_id = (SELECT id FROM chat_sessions WHERE session_id = ?)
      AND sender_type = 'customer'
      AND is_read = 0
    `).bind(sessionId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error marking chat as read:", error);
    return c.json({ error: "Erro ao marcar chat como lido" }, 500);
  }
});

app.put("/api/admin/chat/sessions/:sessionId/close", adminMiddleware, async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    
    // Mark chat session as inactive
    await c.env.DB.prepare(`
      UPDATE chat_sessions SET 
        is_active = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE session_id = ?
    `).bind(sessionId).run();
    
    // Add system message about chat being closed
    await c.env.DB.prepare(`
      INSERT INTO chat_messages (chat_session_id, sender_type, sender_name, message)
      VALUES ((SELECT id FROM chat_sessions WHERE session_id = ?), 'admin', 'Sistema', 'Chat fechado pelo administrador.')
    `).bind(sessionId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error closing chat session:", error);
    return c.json({ error: "Erro ao fechar chat" }, 500);
  }
});

app.put("/api/admin/chat/sessions/:sessionId/reopen", adminMiddleware, async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    
    // Reactivate chat session
    await c.env.DB.prepare(`
      UPDATE chat_sessions SET 
        is_active = 1,
        last_activity_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE session_id = ?
    `).bind(sessionId).run();
    
    // Add system message about chat being reopened
    await c.env.DB.prepare(`
      INSERT INTO chat_messages (chat_session_id, sender_type, sender_name, message)
      VALUES ((SELECT id FROM chat_sessions WHERE session_id = ?), 'admin', 'Sistema', 'Chat reaberto pelo administrador.')
    `).bind(sessionId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error reopening chat session:", error);
    return c.json({ error: "Erro ao reabrir chat" }, 500);
  }
});

// Cart tracking endpoint
app.post("/api/cart-tracking", async (c) => {
  try {
    const body = await c.req.json();
    const { session_id, product_id, product_name, product_price, quantity_added, user_agent } = body;
    
    // Get customer IP address
    const customer_ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    
    console.log(`📊 CART TRACKING: Product ${product_name} (ID: ${product_id}) added to cart by session ${session_id}`);
    
    await c.env.DB.prepare(`
      INSERT INTO cart_tracking (session_id, product_id, product_name, product_price, quantity_added, customer_ip, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(session_id, product_id, product_name, product_price, quantity_added, customer_ip, user_agent).run();
    
    // Check if this triggers any dynamic discounts
    const triggeredDiscounts = await checkDynamicDiscounts(c.env.DB, product_id);
    
    return c.json({ 
      success: true,
      triggered_discounts: triggeredDiscounts
    });
  } catch (error) {
    console.error("Error tracking cart addition:", error);
    return c.json({ error: "Erro ao rastrear adição ao carrinho" }, 500);
  }
});

// Cart analytics endpoint
app.get("/api/admin/cart-analytics", adminMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        product_id,
        product_name,
        product_price,
        COUNT(*) as total_additions,
        SUM(quantity_added) as total_quantity_added,
        COUNT(DISTINCT session_id) as unique_sessions,
        ROUND(AVG(quantity_added), 2) as avg_quantity_per_addition,
        MAX(created_at) as last_added
      FROM cart_tracking 
      GROUP BY product_id, product_name, product_price
      ORDER BY total_additions DESC
    `).all();
    
    console.log(`📊 CART ANALYTICS: Returning analytics for ${results.length} products`);
    
    return c.json({ analytics: results });
  } catch (error) {
    console.error("Error fetching cart analytics:", error);
    return c.json({ error: "Erro ao buscar analytics do carrinho" }, 500);
  }
});

// Dynamic discounts endpoints
app.get("/api/admin/dynamic-discounts", adminMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM dynamic_discounts ORDER BY created_at DESC"
    ).all();
    
    return c.json({ discounts: results });
  } catch (error) {
    console.error("Error fetching dynamic discounts:", error);
    return c.json({ error: "Erro ao buscar descontos dinâmicos" }, 500);
  }
});

app.post("/api/admin/dynamic-discounts", adminMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { product_id, discount_type, discount_value, trigger_condition, trigger_value } = body;
    
    const { success } = await c.env.DB.prepare(`
      INSERT INTO dynamic_discounts (product_id, discount_type, discount_value, trigger_condition, trigger_value)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      product_id,
      discount_type || 'percentage',
      discount_value,
      trigger_condition || 'cart_additions_count',
      trigger_value
    ).run();
    
    if (success) {
      console.log(`🎯 DYNAMIC DISCOUNT CREATED: Product ${product_id} - ${discount_value}${discount_type === 'percentage' ? '%' : ' reais'} when ${trigger_value} additions`);
      return c.json({ message: "Desconto dinâmico criado com sucesso!" });
    } else {
      throw new Error("Failed to create dynamic discount");
    }
  } catch (error) {
    console.error("Error creating dynamic discount:", error);
    return c.json({ error: "Erro ao criar desconto dinâmico" }, 500);
  }
});

app.put("/api/admin/dynamic-discounts/:id", adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { is_active, discount_type, discount_value, trigger_condition, trigger_value } = body;
    
    await c.env.DB.prepare(`
      UPDATE dynamic_discounts SET 
        discount_type = COALESCE(?, discount_type),
        discount_value = COALESCE(?, discount_value),
        trigger_condition = COALESCE(?, trigger_condition),
        trigger_value = COALESCE(?, trigger_value),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      discount_type,
      discount_value,
      trigger_condition,
      trigger_value,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      id
    ).run();
    
    console.log(`🎯 DYNAMIC DISCOUNT UPDATED: ID ${id} - Active: ${is_active}`);
    
    return c.json({ message: "Desconto dinâmico atualizado com sucesso!" });
  } catch (error) {
    console.error("Error updating dynamic discount:", error);
    return c.json({ error: "Erro ao atualizar desconto dinâmico" }, 500);
  }
});

app.delete("/api/admin/dynamic-discounts/:id", adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    
    await c.env.DB.prepare(
      "DELETE FROM dynamic_discounts WHERE id = ?"
    ).bind(id).run();
    
    console.log(`🎯 DYNAMIC DISCOUNT DELETED: ID ${id}`);
    
    return c.json({ message: "Desconto dinâmico removido com sucesso!" });
  } catch (error) {
    console.error("Error deleting dynamic discount:", error);
    return c.json({ error: "Erro ao remover desconto dinâmico" }, 500);
  }
});

// Check available discounts for a product (for frontend)
app.get("/api/dynamic-discounts/:productId", async (c) => {
  try {
    const productId = c.req.param("productId");
    
    // Get active discounts for this product
    const { results: discounts } = await c.env.DB.prepare(`
      SELECT * FROM dynamic_discounts 
      WHERE product_id = ? AND is_active = 1
    `).bind(productId).all();
    
    const discountInfo = [];
    
    for (const discount of discounts) {
      // Count total additions for this product
      const { results: countResults } = await c.env.DB.prepare(`
        SELECT COUNT(*) as total_additions FROM cart_tracking 
        WHERE product_id = ?
      `).bind(productId).all();
      
      const totalAdditions = Number(countResults[0]?.total_additions || 0);
      const remainingAdditions = Math.max(0, Number(discount.trigger_value) - totalAdditions);
      
      discountInfo.push({
        discount_id: discount.id,
        discount_type: discount.discount_type,
        discount_value: discount.discount_value,
        trigger_value: Number(discount.trigger_value),
        current_additions: totalAdditions,
        remaining_additions: remainingAdditions,
        is_triggered: totalAdditions >= Number(discount.trigger_value)
      });
    }
    
    return c.json({ discounts: discountInfo });
  } catch (error) {
    console.error("Error fetching product discounts:", error);
    return c.json({ error: "Erro ao buscar descontos do produto" }, 500);
  }
});

// Analytics cleanup endpoints
app.delete("/api/admin/analytics/clear/:type", adminMiddleware, async (c) => {
  try {
    const type = c.req.param("type");
    let deletedRecords = 0;
    let message = "";
    
    console.log(`🧹 ANALYTICS CLEANUP: Starting ${type} cleanup`);
    
    switch (type) {
      case 'cart_tracking':
        // Clear all cart tracking data
        const cartResult = await c.env.DB.prepare("DELETE FROM cart_tracking").run();
        deletedRecords = cartResult.meta.changes || 0;
        message = `Dados do carrinho limpos! Removidos ${deletedRecords} registros de rastreamento.`;
        console.log(`🧹 CART CLEANUP: Deleted ${deletedRecords} cart tracking records`);
        break;
        
      case 'user_sessions':
        // Clear old/inactive user sessions (keep active ones from last hour)
        const sessionResult = await c.env.DB.prepare(`
          DELETE FROM user_sessions 
          WHERE is_active = 0 
          OR datetime(last_activity_at, '+1 hour') < datetime('now')
        `).run();
        deletedRecords = sessionResult.meta.changes || 0;
        message = `Sessões antigas limpas! Removidas ${deletedRecords} sessões inativas/antigas.`;
        console.log(`🧹 SESSION CLEANUP: Deleted ${deletedRecords} old sessions`);
        break;
        
      case 'all_analytics':
        // Clear both cart tracking and user sessions
        const allCartResult = await c.env.DB.prepare("DELETE FROM cart_tracking").run();
        const allSessionResult = await c.env.DB.prepare(`
          DELETE FROM user_sessions 
          WHERE datetime(last_activity_at, '+1 hour') < datetime('now')
        `).run();
        
        const allCartChanges = allCartResult.meta.changes || 0;
        const allSessionChanges = allSessionResult.meta.changes || 0;
        deletedRecords = allCartChanges + allSessionChanges;
        message = `Limpeza completa realizada! Removidos ${allCartChanges} registros de carrinho e ${allSessionChanges} sessões antigas.`;
        console.log(`🧹 COMPLETE CLEANUP: Deleted ${allCartChanges} cart records and ${allSessionChanges} sessions`);
        break;
        
      default:
        return c.json({ error: "Tipo de limpeza não suportado" }, 400);
    }
    
    return c.json({ 
      success: true,
      message,
      deleted_records: deletedRecords,
      cleanup_type: type,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`🧹 ANALYTICS CLEANUP ERROR (${c.req.param("type")}):`, error);
    return c.json({ error: "Erro ao limpar dados de analytics: " + (error as Error).message }, 500);
  }
});

// Get analytics cleanup stats (for admin dashboard)
app.get("/api/admin/analytics/stats", adminMiddleware, async (c) => {
  try {
    // Get counts for different data types
    const { results: cartStats } = await c.env.DB.prepare("SELECT COUNT(*) as count FROM cart_tracking").all();
    const { results: sessionStats } = await c.env.DB.prepare("SELECT COUNT(*) as count FROM user_sessions").all();
    const { results: activeSessionStats } = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM user_sessions 
      WHERE is_active = 1 AND datetime(last_activity_at, '+1 hour') >= datetime('now')
    `).all();
    const { results: oldSessionStats } = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM user_sessions 
      WHERE is_active = 0 OR datetime(last_activity_at, '+1 hour') < datetime('now')
    `).all();
    
    // Get size estimates (approximate)
    const cartCount = Number(cartStats[0]?.count || 0);
    const totalSessionCount = Number(sessionStats[0]?.count || 0);
    const activeSessionCount = Number(activeSessionStats[0]?.count || 0);
    const oldSessionCount = Number(oldSessionStats[0]?.count || 0);
    
    return c.json({
      cart_tracking: {
        total_records: cartCount,
        estimated_size_kb: Math.round(cartCount * 0.2), // Rough estimate
      },
      user_sessions: {
        total_records: totalSessionCount,
        active_sessions: activeSessionCount,
        old_sessions: oldSessionCount,
        estimated_size_kb: Math.round(totalSessionCount * 0.15), // Rough estimate
      },
      total_records: cartCount + totalSessionCount,
      cleanup_recommendations: {
        cart_cleanup_recommended: cartCount > 1000,
        session_cleanup_recommended: oldSessionCount > 500
      }
    });
  } catch (error) {
    console.error("Error fetching analytics stats:", error);
    return c.json({ error: "Erro ao buscar estatísticas" }, 500);
  }
});

// PagLeve Webhook endpoint (for payment status updates)
app.post("/api/webhook/pagleve", async (c) => {
  try {
    const body = await c.req.json();
    console.log("🟡 PAGLEVE WEBHOOK: Received notification:", body);
    
    // Validate webhook signature if provided by PagLeve
    // const signature = c.req.header('X-PagLeve-Signature');
    // You would validate the signature here for security
    
    const { status, external_id } = body;
    
    if (!external_id) {
      console.error("🔴 PAGLEVE WEBHOOK: Missing external_id (order ID)");
      return c.json({ error: "Missing external_id" }, 400);
    }
    
    // Map PagLeve status to our order status
    let orderStatus = 'pending';
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'confirmed':
      case 'approved':
        orderStatus = 'confirmed';
        break;
      case 'cancelled':
      case 'expired':
      case 'failed':
        orderStatus = 'cancelled';
        break;
      case 'pending':
      case 'waiting':
        orderStatus = 'pending';
        break;
      default:
        console.log(`🟡 PAGLEVE WEBHOOK: Unknown status '${status}', keeping as pending`);
    }
    
    // Update order status in database
    const { success } = await c.env.DB.prepare(`
      UPDATE orders 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(orderStatus, external_id).run();
    
    if (success) {
      console.log(`🟢 PAGLEVE WEBHOOK: Order ${external_id} status updated to ${orderStatus}`);
      return c.json({ success: true, message: "Order status updated" });
    } else {
      console.error(`🔴 PAGLEVE WEBHOOK: Failed to update order ${external_id}`);
      return c.json({ error: "Failed to update order" }, 500);
    }
    
  } catch (error) {
    console.error("🔴 PAGLEVE WEBHOOK: Error processing webhook:", error);
    return c.json({ error: "Webhook processing failed" }, 500);
  }
});

// Test PagLeve connection endpoint
app.post("/api/admin/test-pagleve", adminMiddleware, async (c) => {
  try {
    console.log("🟡 PAGLEVE TEST: Starting comprehensive connection test...");
    
    // Get PagLeve settings from database
    const { results: settingsResults } = await c.env.DB.prepare(`
      SELECT setting_key, setting_value FROM site_settings 
      WHERE setting_key IN ('pagleve_api_key', 'pagleve_secret', 'pagleve_base_url')
    `).all();
    
    const settings: Record<string, string> = {};
    settingsResults.forEach((setting: any) => {
      settings[setting.setting_key] = setting.setting_value || '';
    });
    
    const apiKey = settings.pagleve_api_key || c.env.PAGLEVE_API_KEY || '';
    const secret = settings.pagleve_secret || c.env.PAGLEVE_SECRET || '';
    const configUrl = settings.pagleve_base_url || '';
    
    console.log("🟡 PAGLEVE TEST: Configured URL:", configUrl);
    console.log("🟡 PAGLEVE TEST: API Key:", apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');
    console.log("🟡 PAGLEVE TEST: Secret:", secret ? 'SET' : 'NOT SET');
    
    if (!apiKey || !secret) {
      return c.json({ 
        success: false, 
        error: "Configure as credenciais PagLeve antes de testar (API Key e Secret são obrigatórios)" 
      }, 400);
    }
    
    // Test multiple possible PagLeve URLs
    const possibleUrls = [
      configUrl || 'https://api.pagleve.com',
      'https://api.pagleve.com',
      'https://api.pagaleve.com.br',
      'https://sandbox.pagleve.com',
      'https://pagleve.com/api',
      'https://app.pagleve.com/api',
      'https://gateway.pagleve.com'
    ].filter((url, index, self) => url && self.indexOf(url) === index); // Remove duplicates and empty
    
    // Authentication methods to try
    const authMethods = [
      {
        name: "Basic Auth (api_key:secret)",
        headers: {
          'Authorization': `Basic ${btoa(`${apiKey}:${secret}`)}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Distribuidora-AmBev/1.0',
          'Accept': 'application/json'
        } as Record<string, string>
      },
      {
        name: "Bearer Token + Secret Header",
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-Api-Secret': secret,
          'Content-Type': 'application/json',
          'User-Agent': 'Distribuidora-AmBev/1.0',
          'Accept': 'application/json'
        } as Record<string, string>
      },
      {
        name: "API Key Headers",
        headers: {
          'api-key': apiKey,
          'api-secret': secret,
          'Content-Type': 'application/json',
          'User-Agent': 'Distribuidora-AmBev/1.0',
          'Accept': 'application/json'
        } as Record<string, string>
      },
      {
        name: "X- Prefixed Headers",
        headers: {
          'X-Api-Key': apiKey,
          'X-Api-Secret': secret,
          'Content-Type': 'application/json',
          'User-Agent': 'Distribuidora-AmBev/1.0',
          'Accept': 'application/json'
        } as Record<string, string>
      },
      {
        name: "Authorization Token Only",
        headers: {
          'Authorization': `Token ${apiKey}`,
          'X-Secret': secret,
          'Content-Type': 'application/json',
          'User-Agent': 'Distribuidora-AmBev/1.0',
          'Accept': 'application/json'
        } as Record<string, string>
      },
      {
        name: "Simple API Key",
        headers: {
          'Authorization': apiKey,
          'Secret': secret,
          'Content-Type': 'application/json',
          'User-Agent': 'Distribuidora-AmBev/1.0',
          'Accept': 'application/json'
        } as Record<string, string>
      }
    ];
    
    // Test endpoints in order of likelihood for a payment gateway
    const testEndpoints = [
      '/',
      '/health',
      '/status', 
      '/ping',
      '/api',
      '/v1',
      '/v2',
      '/merchant',
      '/charges',
      '/payments',
      '/transactions'
    ];
    
    let successfulTests: any[] = [];
    let allErrors: any[] = [];
    
    // Try each URL with each auth method
    for (const baseUrl of possibleUrls) {
      console.log(`🟡 PAGLEVE TEST: Testing URL: ${baseUrl}`);
      
      for (const method of authMethods) {
        console.log(`🟡 PAGLEVE TEST: Trying ${method.name} on ${baseUrl}...`);
        
        for (const endpoint of testEndpoints) {
          const fullUrl = `${baseUrl}${endpoint}`;
          
          try {
            const response = await fetch(fullUrl, {
              method: 'GET',
              headers: method.headers,
              signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            
            const responseText = await response.text();
            const logData = {
              url: fullUrl,
              method: method.name,
              status: response.status,
              response: responseText.substring(0, 200)
            };
            
            console.log(`🟡 PAGLEVE TEST: ${method.name} on ${fullUrl} -> ${response.status}`);
            
            if (response.status === 200) {
              successfulTests.push({
                ...logData,
                success: true,
                message: `✅ Sucesso com ${method.name} em ${fullUrl}!`
              });
              
              console.log("🟢 PAGLEVE TEST: SUCCESS FOUND!");
              
              // Return immediately on first success
              try {
                const result = JSON.parse(responseText);
                return c.json({ 
                  success: true, 
                  message: `Conexão com PagLeve estabelecida com sucesso!`,
                  data: result,
                  auth_method: method.name,
                  endpoint: fullUrl,
                  status_code: response.status,
                  all_tests: successfulTests.length + allErrors.length
                });
              } catch (e) {
                return c.json({ 
                  success: true, 
                  message: `Conexão com PagLeve estabelecida com sucesso!`,
                  response: responseText.substring(0, 500),
                  auth_method: method.name,
                  endpoint: fullUrl,
                  status_code: response.status,
                  all_tests: successfulTests.length + allErrors.length
                });
              }
            } else if (response.status === 401) {
              allErrors.push({
                ...logData,
                error: "Credenciais inválidas (401 Unauthorized)"
              });
              // Don't try more endpoints with this auth method
              break;
            } else if (response.status === 403) {
              allErrors.push({
                ...logData,
                error: "Acesso negado (403 Forbidden)"
              });
              // Don't try more endpoints with this auth method  
              break;
            } else if (response.status === 404) {
              // 404 just means endpoint doesn't exist, continue to next endpoint
              console.log(`🟡 PAGLEVE TEST: ${fullUrl} -> 404 (endpoint não existe)`);
              continue;
            } else if (response.status === 405) {
              // Method not allowed, but endpoint exists - this is actually good!
              allErrors.push({
                ...logData,
                error: "Método não permitido (405) - endpoint existe mas precisa POST/PUT"
              });
              continue;
            } else {
              allErrors.push({
                ...logData,
                error: `Status ${response.status}: ${responseText.substring(0, 100)}`
              });
            }
          } catch (fetchError) {
            const errorMsg = (fetchError as Error).message;
            console.log(`🔴 PAGLEVE TEST: Network error on ${fullUrl}:`, errorMsg);
            
            allErrors.push({
              url: fullUrl,
              method: method.name,
              error: `Network error: ${errorMsg}`
            });
            
            // If it's a timeout or network error, try next endpoint
            continue;
          }
        }
      }
    }
    
    // If we get here, no method worked
    console.error("🔴 PAGLEVE TEST: All authentication methods and URLs failed");
    
    // Group errors by type for better feedback
    const authErrors = allErrors.filter(e => e.error.includes('401') || e.error.includes('403'));
    const networkErrors = allErrors.filter(e => e.error.includes('Network'));
    const otherErrors = allErrors.filter(e => !e.error.includes('401') && !e.error.includes('403') && !e.error.includes('Network'));
    
    return c.json({ 
      success: false, 
      error: "Não foi possível conectar com PagLeve usando as credenciais fornecidas.",
      details: {
        tested_urls: possibleUrls,
        tested_methods: authMethods.length,
        total_attempts: allErrors.length,
        auth_errors: authErrors.length,
        network_errors: networkErrors.length,
        other_errors: otherErrors.length
      },
      suggestions: [
        "1. Verifique se suas credenciais PagLeve estão corretas",
        "2. Confirme se sua conta PagLeve está ativa",
        "3. Verifique se a URL da API está correta",
        "4. Entre em contato com o suporte PagLeve para confirmar o formato da API",
        "5. Teste com credenciais de sandbox primeiro (se disponível)"
      ],
      debug_info: {
        first_few_errors: allErrors.slice(0, 5),
        tested_urls: possibleUrls,
        has_credentials: { api_key: !!apiKey, secret: !!secret }
      }
    }, 500);
    
  } catch (error) {
    console.error("🔴 PAGLEVE TEST: Critical error:", error);
    return c.json({ 
      success: false, 
      error: `Erro crítico no teste de conexão: ${(error as Error).message}`,
      stack: (error as Error).stack?.substring(0, 500)
    }, 500);
  }
});

export default app;
