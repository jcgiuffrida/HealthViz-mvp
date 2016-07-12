library("data.table")

#Steps to convert zip to zcta using data.table

#upload datafile to convert 
zipdata <- read.csv("H:/Zip to ZCTA/test_data.csv")
zipdata <-CRC_urbana_intervention12

#zip to zcta reference file upload
ziptozcta <- read.csv("H:/Zip to ZCTA/zip_to_zcta_conversiondata.csv")

#zipdata file must have "zip" as variable name
dat = as.data.table(zipdata)
dat2 = as.data.table(ziptozcta)

newdt<-merge(dat, dat2, by="zip",  all=TRUE)
#if no emr number, use other id value
zctadata <- na.omit(newdt, cols="emr")

#sum of invalid zipcodes in datafile
sum(is.na(zctadata$zcta))

#to delete zip
zctadata <- within(zctadata, rm("zip"))

#write new datafile, with zcta (and/or zip)
write.csv(zctadata, file =
            "H:/newfile_withzcta.csv")