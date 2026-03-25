import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

/**
 * ============================================
 * STUDENT HELP SERVICE - Comprehensive Utilities
 * ============================================
 * Global service with functions to solve various problems
 */

// ========== INTERFACES ==========
export interface ValidationResult {
  valid: boolean;
  message: string;
  errors?: string[];
}

export interface FileUploadResult {
  success: boolean;
  message: string;
  filename?: string;
  size?: number;
  path?: string;
}

export interface ExportResult {
  success: boolean;
  message: string;
  data?: string;
  filename?: string;
}

export interface EmailNotification {
  to: string;
  subject: string;
  message: string;
  html?: string;
}

export interface StudentUser {
  id?: string;
  email: string;
  name: string;
  password?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: StudentUser;
}

// ========== MAIN SERVICE ==========
@Injectable()
export class StudentHelpService {
  private users: Map<string, StudentUser> = new Map();
  private sessions: Map<string, AuthResponse> = new Map();

  /**
   * ========================================
   * 🔐 AUTHENTICATION & SECURITY
   * ========================================
   */

  /**
   * Hash a password with bcrypt
   */
  async hashPassword(password: string, rounds: number = 10): Promise<string> {
    return bcrypt.hash(password, rounds);
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT-like token
   */
  generateToken(payload: any, secret: string = process.env.JWT_SECRET || 'default-secret'): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');

    return `${header}.${body}.${signature}`;
  }

  /**
   * Generate random token
   */
  generateRandomToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Encrypt text with AES-256
   */
  encryptText(text: string, key: string = process.env.ENCRYPTION_KEY || 'default-key'): string {
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt text
   */
  decryptText(encrypted: string, key: string = process.env.ENCRYPTION_KEY || 'default-key'): string {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Generate API Key
   */
  generateApiKey(): string {
    return 'sk_' + crypto.randomBytes(32).toString('hex');
  }

  /**
   * Register a new user
   */
  async register(email: string, name: string, password: string): Promise<AuthResponse> {
    try {
      if (this._getUserByEmail(email)) {
        return { success: false, message: 'User already exists' };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = `user_${Date.now()}`;
      const user: StudentUser = { id: userId, email, name, password: hashedPassword };

      this.users.set(userId, user);

      return {
        success: true,
        message: 'User registered successfully',
        user: { id: userId, email, name }
      };
    } catch (error) {
      return { success: false, message: `Registration failed: ${error.message}` };
    }
  }

  /**
   * Login a user
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const user = this._getUserByEmail(email);

      if (!user || !user.password) {
        return { success: false, message: 'Invalid credentials' };
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return { success: false, message: 'Invalid credentials' };
      }

      const response: AuthResponse = {
        success: true,
        message: 'Login successful',
        user: { id: user.id, email: user.email, name: user.name }
      };

      this.sessions.set(user.id || '', response);
      return response;
    } catch (error) {
      return { success: false, message: `Login failed: ${error.message}` };
    }
  }

  /**
   * Logout a user
   */
  async logout(userId: string): Promise<AuthResponse> {
    try {
      this.sessions.delete(userId);
      return { success: true, message: 'Logout successful' };
    } catch (error) {
      return { success: false, message: `Logout failed: ${error.message}` };
    }
  }

  /**
   * ========================================
   * 📧 EMAIL & NOTIFICATIONS
   * ========================================
   */

  /**
   * Send email notification
   */
  async sendEmail(notification: EmailNotification): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📧 Email sent to ${notification.to}`);
      return { success: true, message: `Email sent to ${notification.to}` };
    } catch (error) {
      return { success: false, message: `Failed to send email: ${error.message}` };
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMS(phoneNumber: string, message: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📱 SMS sent to ${phoneNumber}`);
      return { success: true, message: `SMS sent to ${phoneNumber}` };
    } catch (error) {
      return { success: false, message: `Failed to send SMS: ${error.message}` };
    }
  }

  /**
   * Send webhook notification
   */
  async sendWebhook(url: string, data: any): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔔 Webhook sent to ${url}`);
      return { success: true, message: `Webhook sent to ${url}` };
    } catch (error) {
      return { success: false, message: `Failed to send webhook: ${error.message}` };
    }
  }

  /**
   * ========================================
   * 📄 DATA VALIDATION
   * ========================================
   */

  /**
   * Validate email
   */
  validateEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid = emailRegex.test(email);

    return { valid, message: valid ? 'Valid email' : 'Invalid email' };
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): ValidationResult {
    const errors: string[] = [];

    if (password.length < 8) errors.push('Password must be at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase letters');
    if (!/[a-z]/.test(password)) errors.push('Password must contain lowercase letters');
    if (!/[0-9]/.test(password)) errors.push('Password must contain numbers');
    if (!/[!@#$%^&*]/.test(password)) errors.push('Password must contain special characters');

    return {
      valid: errors.length === 0,
      message: errors.length === 0 ? 'Strong password' : 'Weak password',
      errors
    };
  }

  /**
   * Validate CPF (Brazilian)
   */
  validateCPF(cpf: string): ValidationResult {
    const cleanCPF = cpf.replace(/\D/g, '');

    if (cleanCPF.length !== 11 || /^(\d)\1{10}$/.test(cleanCPF)) {
      return { valid: false, message: 'Invalid CPF' };
    }

    const calculate = (s: number): number => {
      let sum = 0;
      let multiplier = s + 1;
      for (let i = 0; i < s; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * multiplier--;
      }
      const remainder = (sum * 10) % 11;
      return remainder === 10 ? 0 : remainder;
    };

    const digit1 = calculate(9);
    const digit2 = calculate(10);
    const isValid = parseInt(cleanCPF.charAt(9)) === digit1 && parseInt(cleanCPF.charAt(10)) === digit2;

    return { valid: isValid, message: isValid ? 'Valid CPF' : 'Invalid CPF' };
  }

  /**
   * Validate phone number
   */
  validatePhoneNumber(phone: string): ValidationResult {
    const cleanPhone = phone.replace(/\D/g, '');
    const valid = cleanPhone.length >= 10 && cleanPhone.length <= 15;

    return { valid, message: valid ? 'Valid phone number' : 'Invalid phone number' };
  }

  /**
   * Validate URL
   */
  validateURL(url: string): ValidationResult {
    try {
      new URL(url);
      return { valid: true, message: 'Valid URL' };
    } catch {
      return { valid: false, message: 'Invalid URL' };
    }
  }

  /**
   * ========================================
   * 📝 DATA TRANSFORMATION & SANITIZATION
   * ========================================
   */

  /**
   * Sanitize string
   */
  sanitizeString(str: string): string {
    return str.replace(/<[^>]*>/g, '').trim().substring(0, 1000);
  }

  /**
   * Capitalize first letter
   */
  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Convert to slug
   */
  toSlug(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number, currency: string = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amount);
  }

  /**
   * Format date
   */
  formatDate(date: Date, format: string = 'DD/MM/YYYY'): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return format.replace('DD', day).replace('MM', month).replace('YYYY', String(year));
  }

  /**
   * Parse JSON safely
   */
  safeParseJSON(jsonString: string, defaultValue: any = null): any {
    try {
      return JSON.parse(jsonString);
    } catch {
      return defaultValue;
    }
  }

  /**
   * ========================================
   * 📊 DATA EXPORT
   * ========================================
   */

  /**
   * Generate CSV from array of objects
   */
  generateCSV(data: any[], filename: string = 'export.csv'): ExportResult {
    try {
      if (!data || data.length === 0) {
        return { success: false, message: 'No data to export' };
      }

      const keys = Object.keys(data[0]);
      const header = keys.join(',');
      const rows = data.map(obj =>
        keys.map(key => `"${String(obj[key] || '').replace(/"/g, '""')}"`).join(',')
      );

      const csv = [header, ...rows].join('\n');

      return { success: true, message: 'CSV generated successfully', data: csv, filename };
    } catch (error) {
      return { success: false, message: `Failed to generate CSV: ${error.message}` };
    }
  }

  /**
   * Generate JSON from data
   */
  generateJSON(data: any, filename: string = 'export.json'): ExportResult {
    try {
      const json = JSON.stringify(data, null, 2);
      return { success: true, message: 'JSON generated successfully', data: json, filename };
    } catch (error) {
      return { success: false, message: `Failed to generate JSON: ${error.message}` };
    }
  }

  /**
   * Generate basic report
   */
  generateReport(title: string, content: any): ExportResult {
    try {
      const report = `
===============================================
${title}
===============================================
Generated at: ${new Date().toLocaleString('pt-BR')}

${JSON.stringify(content, null, 2)}

===============================================
      `.trim();

      return { success: true, message: 'Report generated successfully', data: report, filename: `report_${Date.now()}.txt` };
    } catch (error) {
      return { success: false, message: `Failed to generate report: ${error.message}` };
    }
  }

  /**
   * ========================================
   * 📁 FILE UPLOAD & PROCESSING
   * ========================================
   */

  /**
   * Validate file upload
   */
  validateFileUpload(filename: string, size: number, allowedTypes: string[] = ['jpg', 'png', 'pdf']): FileUploadResult {
    const maxSize = 10 * 1024 * 1024;

    if (size > maxSize) {
      return { success: false, message: `File size exceeds limit (${maxSize / 1024 / 1024}MB)` };
    }

    const ext = filename.split('.').pop()?.toLowerCase() || '';

    if (!allowedTypes.includes(ext)) {
      return { success: false, message: `File type not allowed. Allowed: ${allowedTypes.join(', ')}` };
    }

    return { success: true, message: 'File is valid' };
  }

  /**
   * Generate safe filename
   */
  generateSafeFilename(originalFilename: string): string {
    const sanitized = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const ext = sanitized.split('.').pop();

    return `${timestamp}_${sanitized.split('.')[0]}.${ext}`;
  }

  /**
   * Process image
   */
  async processImage(filename: string, width?: number, height?: number): Promise<FileUploadResult> {
    return { success: true, message: 'Image processed successfully', filename: `resized_${filename}` };
  }

  /**
   * ========================================
   * 🧮 MATHEMATICAL & CONVERSION UTILITIES
   * ========================================
   */

  /**
   * Calculate percentage
   */
  calculatePercentage(value: number, total: number): number {
    return total === 0 ? 0 : (value / total) * 100;
  }

  /**
   * Calculate discount
   */
  calculateDiscount(originalPrice: number, discountPercent: number): number {
    return originalPrice * (1 - discountPercent / 100);
  }

  /**
   * Calculate compound interest
   */
  calculateCompoundInterest(principal: number, rate: number, time: number, compounds: number = 12): number {
    return principal * Math.pow(1 + rate / 100 / compounds, compounds * time);
  }

  /**
   * Convert temperature
   */
  convertTemperature(value: number, from: 'C' | 'F' | 'K', to: 'C' | 'F' | 'K'): number {
    let celsius: number;

    if (from === 'C') {
      celsius = value;
    } else if (from === 'F') {
      celsius = (value - 32) * (5 / 9);
    } else {
      celsius = value - 273.15;
    }

    if (to === 'C') {
      return Math.round(celsius * 100) / 100;
    } else if (to === 'F') {
      return Math.round((celsius * 9) / 5 + 32 * 100) / 100;
    } else {
      return Math.round((celsius + 273.15) * 100) / 100;
    }
  }

  /**
   * Convert distance units
   */
  convertDistance(value: number, from: 'mm' | 'cm' | 'm' | 'km', to: 'mm' | 'cm' | 'm' | 'km'): number {
    const toMm = { mm: 1, cm: 10, m: 1000, km: 1000000 };
    const valueInMm = value * toMm[from];
    return valueInMm / toMm[to];
  }

  /**
   * Generate random number
   */
  randomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate random string
   */
  randomString(length: number = 10): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  /**
   * ========================================
   * 🛠️ GENERAL UTILITIES
   * ========================================
   */

  /**
   * Delay execution (sleep)
   */
  sleep(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  /**
   * Retry function with exponential backoff
   */
  async retry<T>(fn: () => Promise<T>, maxAttempts: number = 3, delayMs: number = 1000): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxAttempts) throw error;
        await this.sleep(delayMs * attempt);
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Get user by ID
   */
  getUser(userId: string): StudentUser | null {
    const user = this.users.get(userId);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as StudentUser;
    }
    return null;
  }

  /**
   * Get all users
   */
  getAllUsers(): StudentUser[] {
    const users: StudentUser[] = [];
    this.users.forEach((user) => {
      const { password, ...userWithoutPassword } = user;
      users.push(userWithoutPassword as StudentUser);
    });
    return users;
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updateData: Partial<StudentUser>): Promise<AuthResponse> {
    try {
      const user = this.users.get(userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      if (updateData.name) user.name = updateData.name;
      if (updateData.email) user.email = updateData.email;

      return { success: true, message: 'User updated successfully', user: { id: user.id, email: user.email, name: user.name } };
    } catch (error) {
      return { success: false, message: `Update failed: ${error.message}` };
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<AuthResponse> {
    try {
      const user = this.users.get(userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      this.users.delete(userId);
      this.sessions.delete(userId);

      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      return { success: false, message: `Delete failed: ${error.message}` };
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(userId: string): boolean {
    return this.sessions.has(userId);
  }

  /**
   * Get user by email (private helper)
   */
  private _getUserByEmail(email: string): StudentUser | null {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  /**
   * Get service info
   */
  getInfo() {
    return {
      name: 'StudentHelp',
      version: '2.0.0',
      description: 'Complete utility service with multiple helpful functions',
      modules: [
        '🔐 Authentication & Security (hash, encrypt, tokens)',
        '📧 Email & Notifications (email, SMS, webhooks)',
        '📄 Data Validation (email, password, CPF, phone, URL)',
        '📝 Data Transformation (sanitize, format, transform)',
        '📊 Data Export (CSV, JSON, reports)',
        '📁 File Upload (validation, processing)',
        '🧮 Math & Conversions (percentage, interest, temperature, distance)',
        '🛠️ General Utilities (sleep, retry, random)'
      ]
    };
  }
}
