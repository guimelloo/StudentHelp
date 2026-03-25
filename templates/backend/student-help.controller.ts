import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import {
  StudentHelpService,
  AuthResponse,
  ValidationResult,
  ExportResult,
  FileUploadResult,
  EmailNotification
} from './student-help.service';

@Controller('student-help')
export class StudentHelpController {
  constructor(private studentHelpService: StudentHelpService) {}

  /**
   * ========================================
   * 🔐 AUTHENTICATION ENDPOINTS
   * ========================================
   */

  @Post('register')
  async register(@Body() body: { email: string; name: string; password: string }): Promise<AuthResponse> {
    return this.studentHelpService.register(body.email, body.name, body.password);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }): Promise<AuthResponse> {
    return this.studentHelpService.login(body.email, body.password);
  }

  @Post('logout/:userId')
  async logout(@Param('userId') userId: string): Promise<AuthResponse> {
    return this.studentHelpService.logout(userId);
  }

  /**
   * ========================================
   * 🔐 SECURITY ENDPOINTS
   * ========================================
   */

  @Post('hash-password')
  async hashPassword(@Body() body: { password: string; rounds?: number }): Promise<{ hash: string }> {
    const hash = await this.studentHelpService.hashPassword(body.password, body.rounds);
    return { hash };
  }

  @Post('compare-password')
  async comparePassword(
    @Body() body: { password: string; hash: string }
  ): Promise<{ match: boolean }> {
    const match = await this.studentHelpService.comparePassword(body.password, body.hash);
    return { match };
  }

  @Post('generate-token')
  generateToken(
    @Body() body: { payload: any; secret?: string }
  ): Promise<{ token: string }> {
    const token = this.studentHelpService.generateToken(body.payload, body.secret);
    return Promise.resolve({ token });
  }

  @Get('generate-random-token')
  generateRandomToken(@Query('length') length?: string): Promise<{ token: string }> {
    const token = this.studentHelpService.generateRandomToken(length ? parseInt(length) : undefined);
    return Promise.resolve({ token });
  }

  @Post('encrypt')
  encrypt(@Body() body: { text: string; key?: string }): Promise<{ encrypted: string }> {
    const encrypted = this.studentHelpService.encryptText(body.text, body.key);
    return Promise.resolve({ encrypted });
  }

  @Post('decrypt')
  decrypt(@Body() body: { encrypted: string; key?: string }): Promise<{ text: string }> {
    const text = this.studentHelpService.decryptText(body.encrypted, body.key);
    return Promise.resolve({ text });
  }

  @Get('generate-api-key')
  generateApiKey(): Promise<{ apiKey: string }> {
    const apiKey = this.studentHelpService.generateApiKey();
    return Promise.resolve({ apiKey });
  }

  /**
   * ========================================
   * 📧 NOTIFICATION ENDPOINTS
   * ========================================
   */

  @Post('send-email')
  async sendEmail(@Body() notification: EmailNotification) {
    return this.studentHelpService.sendEmail(notification);
  }

  @Post('send-sms')
  async sendSMS(@Body() body: { phoneNumber: string; message: string }) {
    return this.studentHelpService.sendSMS(body.phoneNumber, body.message);
  }

  @Post('send-webhook')
  async sendWebhook(@Body() body: { url: string; data: any }) {
    return this.studentHelpService.sendWebhook(body.url, body.data);
  }

  /**
   * ========================================
   * 📄 VALIDATION ENDPOINTS
   * ========================================
   */

  @Post('validate-email')
  validateEmail(@Body() body: { email: string }): ValidationResult {
    return this.studentHelpService.validateEmail(body.email);
  }

  @Post('validate-password')
  validatePasswordStrength(@Body() body: { password: string }): ValidationResult {
    return this.studentHelpService.validatePasswordStrength(body.password);
  }

  @Post('validate-cpf')
  validateCPF(@Body() body: { cpf: string }): ValidationResult {
    return this.studentHelpService.validateCPF(body.cpf);
  }

  @Post('validate-phone')
  validatePhoneNumber(@Body() body: { phone: string }): ValidationResult {
    return this.studentHelpService.validatePhoneNumber(body.phone);
  }

  @Post('validate-url')
  validateURL(@Body() body: { url: string }): ValidationResult {
    return this.studentHelpService.validateURL(body.url);
  }

  /**
   * ========================================
   * 📝 TRANSFORMATION ENDPOINTS
   * ========================================
   */

  @Post('sanitize')
  sanitizeString(@Body() body: { text: string }): Promise<{ sanitized: string }> {
    const sanitized = this.studentHelpService.sanitizeString(body.text);
    return Promise.resolve({ sanitized });
  }

  @Post('capitalize')
  capitalize(@Body() body: { text: string }): Promise<{ result: string }> {
    const result = this.studentHelpService.capitalize(body.text);
    return Promise.resolve({ result });
  }

  @Post('to-slug')
  toSlug(@Body() body: { text: string }): Promise<{ slug: string }> {
    const slug = this.studentHelpService.toSlug(body.text);
    return Promise.resolve({ slug });
  }

  @Post('format-currency')
  formatCurrency(@Body() body: { amount: number; currency?: string }): Promise<{ formatted: string }> {
    const formatted = this.studentHelpService.formatCurrency(body.amount, body.currency);
    return Promise.resolve({ formatted });
  }

  @Post('format-date')
  formatDate(@Body() body: { date: string; format?: string }): Promise<{ formatted: string }> {
    const formatted = this.studentHelpService.formatDate(new Date(body.date), body.format);
    return Promise.resolve({ formatted });
  }

  @Post('parse-json')
  safeParseJSON(@Body() body: { json: string; defaultValue?: any }): Promise<{ result: any }> {
    const result = this.studentHelpService.safeParseJSON(body.json, body.defaultValue);
    return Promise.resolve({ result });
  }

  /**
   * ========================================
   * 📊 EXPORT ENDPOINTS
   * ========================================
   */

  @Post('export-csv')
  generateCSV(@Body() body: { data: any[]; filename?: string }): ExportResult {
    return this.studentHelpService.generateCSV(body.data, body.filename);
  }

  @Post('export-json')
  generateJSON(@Body() body: { data: any; filename?: string }): ExportResult {
    return this.studentHelpService.generateJSON(body.data, body.filename);
  }

  @Post('generate-report')
  generateReport(@Body() body: { title: string; content: any }): ExportResult {
    return this.studentHelpService.generateReport(body.title, body.content);
  }

  /**
   * ========================================
   * 📁 FILE UPLOAD ENDPOINTS
   * ========================================
   */

  @Post('validate-file')
  validateFileUpload(
    @Body() body: { filename: string; size: number; allowedTypes?: string[] }
  ): FileUploadResult {
    return this.studentHelpService.validateFileUpload(body.filename, body.size, body.allowedTypes);
  }

  @Post('safe-filename')
  generateSafeFilename(@Body() body: { filename: string }): Promise<{ safeFilename: string }> {
    const safeFilename = this.studentHelpService.generateSafeFilename(body.filename);
    return Promise.resolve({ safeFilename });
  }

  @Post('process-image')
  async processImage(
    @Body() body: { filename: string; width?: number; height?: number }
  ): Promise<FileUploadResult> {
    return this.studentHelpService.processImage(body.filename, body.width, body.height);
  }

  /**
   * ========================================
   * 🧮 MATH & CONVERSION ENDPOINTS
   * ========================================
   */

  @Post('calculate-percentage')
  calculatePercentage(@Body() body: { value: number; total: number }): Promise<{ percentage: number }> {
    const percentage = this.studentHelpService.calculatePercentage(body.value, body.total);
    return Promise.resolve({ percentage });
  }

  @Post('calculate-discount')
  calculateDiscount(
    @Body() body: { originalPrice: number; discountPercent: number }
  ): Promise<{ finalPrice: number }> {
    const finalPrice = this.studentHelpService.calculateDiscount(body.originalPrice, body.discountPercent);
    return Promise.resolve({ finalPrice });
  }

  @Post('calculate-interest')
  calculateCompoundInterest(
    @Body() body: { principal: number; rate: number; time: number; compounds?: number }
  ): Promise<{ finalAmount: number }> {
    const finalAmount = this.studentHelpService.calculateCompoundInterest(
      body.principal,
      body.rate,
      body.time,
      body.compounds
    );
    return Promise.resolve({ finalAmount });
  }

  @Post('convert-temperature')
  convertTemperature(
    @Body() body: { value: number; from: 'C' | 'F' | 'K'; to: 'C' | 'F' | 'K' }
  ): Promise<{ result: number }> {
    const result = this.studentHelpService.convertTemperature(body.value, body.from, body.to);
    return Promise.resolve({ result });
  }

  @Post('convert-distance')
  convertDistance(
    @Body() body: { value: number; from: 'mm' | 'cm' | 'm' | 'km'; to: 'mm' | 'cm' | 'm' | 'km' }
  ): Promise<{ result: number }> {
    const result = this.studentHelpService.convertDistance(body.value, body.from, body.to);
    return Promise.resolve({ result });
  }

  @Post('random-number')
  randomNumber(@Body() body: { min: number; max: number }): Promise<{ number: number }> {
    const number = this.studentHelpService.randomNumber(body.min, body.max);
    return Promise.resolve({ number });
  }

  @Get('random-string')
  randomString(@Query('length') length?: string): Promise<{ string: string }> {
    const randomStr = this.studentHelpService.randomString(length ? parseInt(length) : undefined);
    return Promise.resolve({ string: randomStr });
  }

  /**
   * ========================================
   * 📋 USER MANAGEMENT ENDPOINTS
   * ========================================
   */

  @Get('user/:userId')
  getUser(@Param('userId') userId: string) {
    return this.studentHelpService.getUser(userId);
  }

  @Get('users')
  getAllUsers() {
    return this.studentHelpService.getAllUsers();
  }

  @Put('user/:userId')
  async updateUser(@Param('userId') userId: string, @Body() body: any): Promise<AuthResponse> {
    return this.studentHelpService.updateUser(userId, body);
  }

  @Delete('user/:userId')
  async deleteUser(@Param('userId') userId: string): Promise<AuthResponse> {
    return this.studentHelpService.deleteUser(userId);
  }

  /**
   * ========================================
   * 🛠️ UTILITY ENDPOINTS
   * ========================================
   */

  @Post('sleep')
  async sleep(@Body() body: { milliseconds: number }): Promise<{ message: string }> {
    await this.studentHelpService.sleep(body.milliseconds);
    return { message: 'Done waiting' };
  }

  @Get('info')
  getInfo() {
    return this.studentHelpService.getInfo();
  }
}
