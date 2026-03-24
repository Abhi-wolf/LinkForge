import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Handlebars from 'handlebars';
import { emailSettings } from '../config/email.config';

export class EmailTemplateRenderer {
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.registerHelpers();
  }

  private registerHelpers() {
    Handlebars.registerHelper('formatDate', (date: Date) => {
      return new Date(date).toLocaleDateString();
    });

    Handlebars.registerHelper('currentDate', () => {
      return new Date().toLocaleDateString();
    });

    Handlebars.registerHelper('uppercase', (str: string) => {
      return str.toUpperCase();
    });

    Handlebars.registerHelper('toLowerCase', (str: string) => {
      return str.toLowerCase();
    });
  }

  public renderTemplate(templateName: string, data: any): { html: string; text: string } {
    const htmlTemplate = this.getTemplate(templateName, 'html');
    const textTemplate = this.getTemplate(templateName, 'text');

    return {
      html: htmlTemplate(data),
      text: textTemplate(data),
    };
  }

  private getTemplate(templateName: string, type: 'html' | 'text'): HandlebarsTemplateDelegate {
    const cacheKey = `${templateName}-${type}`;
    
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!;
    }

    const templatePath = path.join(
      emailSettings.templatesPath,
      `${templateName}.${type}.hbs`
    );

    try {
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const template = Handlebars.compile(templateContent);
      this.templateCache.set(cacheKey, template);
      return template;
    } catch (error) {
      throw new Error(`Failed to load template: ${templatePath}`);
    }
  }

  public clearCache(): void {
    this.templateCache.clear();
  }
}

export const generateSecureToken = (length: number = 32): string => {
   const byteLength = Math.ceil(length * 0.75);
  return crypto
    .randomBytes(byteLength)
    .toString('base64url')   // URL-safe: no +, /, = characters
    .slice(0, length);
};

export const generateVerificationToken = (): string => {
  return generateSecureToken(64);
};

export const generateResetToken = (): string => {
  return generateSecureToken(32);
};
