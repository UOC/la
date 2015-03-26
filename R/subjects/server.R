library(shiny)
library(ggplot2)
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

shinyServer(function(input, output) {
  output$distPlot <- renderPlot({
    cbPalette <- c("#009E73", "#D55E00")
    ggplot(assignatures.melt[assignatures.melt$subject==input$subject,], aes(x=semester, y=value, fill=variable)) +
      scale_fill_manual(values=cbPalette) +
      geom_bar(stat = "identity", position = "stack") +
      geom_text(aes(label = percent, y = pos), size = 3) +
      xlab("Semestres (codi)") +
      ylab("Nombre d'estudiants") +
      ggtitle("Estudiants aprovats i suspesos per semestre i assignatura")
  })
})