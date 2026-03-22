import type { ToolDefinition } from '../tools/types.js';
import type { ServerContext } from './context.js';
import { createAppTools } from '../tools/apps/appTools.js';
import { createClipboardTools } from '../tools/clipboard/clipboardTools.js';
import { createInputTools } from '../tools/input/inputTools.js';
import { createScreenTools } from '../tools/screen/screenTools.js';
import { createSystemTools } from '../tools/system/systemTools.js';
import { createWindowTools } from '../tools/windows/windowTools.js';

export function getToolDefinitions(context: ServerContext): ToolDefinition<any, unknown>[] {
  return [
    ...createSystemTools(context),
    ...createWindowTools(context),
    ...createAppTools(context),
    ...createScreenTools(context),
    ...createInputTools(context),
    ...createClipboardTools(context)
  ];
}
