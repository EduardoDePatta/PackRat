import { TemplateNotFoundError } from '../../helpers/errors';
import Template from '../../models/templateModel';
import * as validators from "@packrat/packages"
import { adminProcedure } from '../../middleware/isAdmin';

/**
 * Deletes a template.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise<void>} A Promise that resolves when the template is deleted.
 */
export const deleteTemplate = async (req, res, next) => {
  const { templateId } = req.params;

  const template: any = await Template.findById(templateId);

  if (template) {
    await template.remove();
    res.json({ message: 'Template removed' });
  } else {
    next(TemplateNotFoundError);
  }
};

export function deleteTemplateRoute() {
  return adminProcedure
    .input(validators.deleteTemplate)
    .mutation(async (opts) => {
      const { templateId } = opts.input;
      const template: any = await Template.findById(templateId);
      if (template) {
        await template.remove();
        return { message: 'Template removed' };
      } else {
        throw new Error(TemplateNotFoundError.message);
      }
    });
}