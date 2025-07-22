// pages/api/ai/admin/template-manager.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../middleware/auth';
import { logger } from '@/lib/utils/logger';
import { db } from '@/lib/supabase/services/database.service';

interface PromptTemplate {
  id?: string;
  name: string;
  description?: string;
  template: string;
  variables: string[];
  category: 'analysis' | 'insights' | 'reports' | 'recommendations';
  model?: string;
  temperature?: number;
  maxTokens?: number;
  isActive: boolean;
  version: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

async function handler(req: NextApiRequest & { user?: any }, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      // List all templates or get specific template
      try {
        const { id, category, active } = req.query;
        
        let query = db.supabase
          .from('ai_prompt_templates')
          .select('*')
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        if (id) {
          query = query.eq('id', id);
        }
        
        if (category) {
          query = query.eq('category', category);
        }
        
        if (active !== undefined) {
          query = query.eq('is_active', active === 'true');
        }

        const { data, error } = await query;
        
        if (error) throw error;

        logger.info('AI_ADMIN', 'TEMPLATES_RETRIEVED', {
          count: data?.length,
          filters: { id, category, active }
        });

        res.status(200).json({
          templates: data || [],
          count: data?.length || 0
        });
        
      } catch (error: any) {
        logger.error('AI_ADMIN', 'GET_TEMPLATES_ERROR', error);
        res.status(500).json({
          error: 'Failed to retrieve templates',
          message: error.message
        });
      }
      break;

    case 'POST':
      // Create new template
      try {
        const template: PromptTemplate = req.body;
        
        // Validate template
        if (!template.name || !template.template || !template.category) {
          return res.status(400).json({
            error: 'Missing required fields: name, template, category'
          });
        }

        // Extract variables from template
        const variablePattern = /\{\{(\w+)\}\}/g;
        const variables: string[] = [];
        let match;
        
        while ((match = variablePattern.exec(template.template)) !== null) {
          if (!variables.includes(match[1])) {
            variables.push(match[1]);
          }
        }

        // Create template
        const { data, error } = await db.supabase
          .from('ai_prompt_templates')
          .insert({
            name: template.name,
            description: template.description,
            template: template.template,
            variables,
            category: template.category,
            model: template.model || 'gpt-3.5-turbo',
            temperature: template.temperature || 0.7,
            max_tokens: template.maxTokens || 1000,
            is_active: template.isActive ?? true,
            version: 1,
            created_by: req.user?.id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;

        logger.info('AI_ADMIN', 'TEMPLATE_CREATED', {
          templateId: data.id,
          name: data.name,
          category: data.category
        });

        res.status(201).json({
          message: 'Template created successfully',
          template: data
        });
        
      } catch (error: any) {
        logger.error('AI_ADMIN', 'CREATE_TEMPLATE_ERROR', error);
        res.status(500).json({
          error: 'Failed to create template',
          message: error.message
        });
      }
      break;

    case 'PUT':
      // Update existing template
      try {
        const { id } = req.query;
        const updates: Partial<PromptTemplate> = req.body;
        
        if (!id) {
          return res.status(400).json({
            error: 'Template ID required'
          });
        }

        // Get current template for versioning
        const { data: current } = await db.supabase
          .from('ai_prompt_templates')
          .select('version')
          .eq('id', id)
          .single();

        // Extract variables if template changed
        let variables = updates.variables;
        if (updates.template && !variables) {
          const variablePattern = /\{\{(\w+)\}\}/g;
          variables = [];
          let match;
          
          while ((match = variablePattern.exec(updates.template)) !== null) {
            if (!variables.includes(match[1])) {
              variables.push(match[1]);
            }
          }
        }

        // Update template
        const { data, error } = await db.supabase
          .from('ai_prompt_templates')
          .update({
            ...updates,
            variables,
            version: (current?.version || 1) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        logger.info('AI_ADMIN', 'TEMPLATE_UPDATED', {
          templateId: id,
          version: data.version
        });

        res.status(200).json({
          message: 'Template updated successfully',
          template: data
        });
        
      } catch (error: any) {
        logger.error('AI_ADMIN', 'UPDATE_TEMPLATE_ERROR', error);
        res.status(500).json({
          error: 'Failed to update template',
          message: error.message
        });
      }
      break;

    case 'DELETE':
      // Soft delete template (set inactive)
      try {
        const { id } = req.query;
        
        if (!id) {
          return res.status(400).json({
            error: 'Template ID required'
          });
        }

        const { error } = await db.supabase
          .from('ai_prompt_templates')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) throw error;

        logger.info('AI_ADMIN', 'TEMPLATE_DEACTIVATED', {
          templateId: id
        });

        res.status(200).json({
          message: 'Template deactivated successfully'
        });
        
      } catch (error: any) {
        logger.error('AI_ADMIN', 'DELETE_TEMPLATE_ERROR', error);
        res.status(500).json({
          error: 'Failed to deactivate template',
          message: error.message
        });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}

// Only admins can manage templates
export default withAuth(handler, { requireRole: ['admin'] });