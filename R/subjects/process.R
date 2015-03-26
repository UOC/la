library(lattice)
library(reshape2)
library(scales)
require(plyr)

assignatures <- read.csv("assignatures.csv", sep="\t")
assignatures.aprovades <- read.csv("assignatures-aprovades.csv", sep="\t")
assignatures.merged <- merge(assignatures, assignatures.aprovades, by=c("subject","semester"))
names(assignatures.merged) <- c("subject","semester","total","aprovades")
assignatures.merged$semester <- as.factor(assignatures.merged$semester)
assignatures.merged$suspeses <- assignatures.merged$total - assignatures.merged$aprovades
assignatures.melt <- melt(assignatures.merged, id=c("subject", "semester", "total"))
assignatures.melt$percent <- round(assignatures.melt$value/assignatures.melt$total, 4)*100
assignatures.melt <- ddply(assignatures.melt, .(subject, semester), transform, pos = cumsum(value) - (0.5 * value))
