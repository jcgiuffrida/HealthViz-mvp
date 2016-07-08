# R script to normalize a tabular dataset so that it can be imported into eav_EAV.

rm(list=ls(all=TRUE))
options(scipen=999)  # turn off scientific notation
filepath = 'C:\\Your\\Path\\Here\\'
filename = 'filename.csv'  # does not have to be CSV, but change the "sep" argument in the following line

t <- read.table(paste(filepath, filename, sep=""), sep=',', header=TRUE, stringsAsFactors=FALSE)
final <- data.frame(id=integer(), geography=character(), attribute=character(), value=numeric(), suppression=character(), row.names=NULL, stringsAsFactors = FALSE)
attr_table <- data.frame(id=integer(), geography=character(), attribute=character(), value=numeric(), suppression=character(), row.names=NULL, stringsAsFactors = FALSE)

# globals
id_start = 1  # first number for the unique row ID
suppression = ""  # suppression code to apply (if none, write "")

# your table should have the following format:
### each row is a geography
### first column is the geography id
### every additional column is an attribute

id_current = id_start
count = nrow(t)

# for each attribute
for (i in c(2:length(names(t)))){
  attr_table <- attr_table[0,]
  # for each geography
  for (j in c(1:nrow(t))){
    row <- c(as.numeric(id_current), as.numeric(t[j, 1]), names(t)[i], as.numeric(t[j, i]), suppression)
    # rbind to attr_table so we rbind the full table as little as possible
    attr_table[j,] <- row
    id_current <- id_current + 1
  }
  final <- rbind(final, attr_table)
  cat(names(t)[i],"finished,",nrow(final),"rows\n")
  flush.console()
}

sum(as.numeric(final$value))

write.table(final, paste(filepath, substr(filename, 1, nchar(filename)-4), '_normalized.csv', sep=""), sep=',', row.names=FALSE)

# In Excel, use VLOOKUP to replace the attribute names with their IDs, and (if necessary) the geography names with their IDs
  
  
  
  
  
  
  
  