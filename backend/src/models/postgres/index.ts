import { WorkItem } from "./WorkItem";
import { RCA } from "./RCA";

// Define Associations
WorkItem.hasOne(RCA, { foreignKey: "workItemId", as: "rca" });
RCA.belongsTo(WorkItem, { foreignKey: "workItemId", as: "workItem" });

export { WorkItem, RCA };
