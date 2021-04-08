var express = require("express");
var xml2js = require("xml2js");
var fs = require("fs");

const router = express.Router();
const parser = new xml2js.Parser({
  explicitArray: false,
});

const builder = new xml2js.Builder();

router.get("/", function (req, res, next) {
  res.render("brandcollection", {
    brands: req.session.xmlObj.Marki.Marka,
  });
});

// Otwarcie XML z nazwy
router.post("/", function (req, res, next) {
  req.session.xmlFileName = `${__dirname}/../public/xml/${req.body.fname}`;
  parser
    .parseStringPromise(fs.readFileSync(req.session.xmlFileName, "utf-8"))
    .then((result) => {
      req.session.xmlObj = result;
      res.redirect("/brandcollection");
    });
});

// Dodawanie marki
router.get("/addBrand", (req, res, next) => {
  res.render("addBrand");
});

router.post("/addBrand", (req, res, next) => {
  let newBrand = addNewObject(req.body);
  newBrand.$.id =
    "m" +
    (
      parseInt(
        req.session.xmlObj.Marki.Marka[
          req.session.xmlObj.Marki.Marka.length - 1
        ].$.id.replace(/\D/g, "")
      ) + 1
    ).toString();
  req.session.xmlObj.Marki.Marka.push(newBrand);
  var xml = builder.buildObject(req.session.xmlObj);
  fs.writeFileSync(req.session.xmlFileName, xml);
  res.redirect("/brandcollection");
});

// Edytowanie Marki
router.get("/editBrand/:id", (req, res, next) => {
  const brandtoedit = req.session.xmlObj.Marki.Marka.find((brand) => {
    return brand.$.id == req.params.id;
  });
  res.render("editBrand", {
    brand: brandtoedit,
  });
});

router.post("/editBrand/:id", (req, res, next) => {
  const brandtoedit = req.session.xmlObj.Marki.Marka.find((brand) => {
    return brand.$.id == req.params.id;
  });
  const brandtoeditIndex = req.session.xmlObj.Marki.Marka.findIndex((brand) => {
    return brand.$.id == req.params.id;
  });

  let newObj = addNewObject(req.body);
  newObj.$.id = brandtoedit.$.id;
  req.session.xmlObj.Marki.Marka[brandtoeditIndex] = newObj;
  xml = builder.buildObject(req.session.xmlObj);
  fs.writeFileSync(req.session.xmlFileName, xml);
  res.redirect("/brandcollection");
});

// Usuwanie elementów
router.get("/deleteBrand/:id", (req, res) => {
  const brandBackup = req.session.xmlObj.Marki.Marka.find((brand) => {
    return brand.$.id == req.params.id;
  });
  const brandtodeleteIndex = req.session.xmlObj.Marki.Marka.findIndex(
    (brand) => {
      return brand.$.id == req.params.id;
    }
  );

  req.session.xmlObj.Marki.Marka.splice(brandtodeleteIndex, 1);
  xml = builder.buildObject(req.session.xmlObj);
  fs.writeFileSync(req.session.xmlFileName, xml);
  res.redirect("/brandcollection");
});

// Funckja dodająca i sprawdzająca walidacje danych elementów
function addNewObject(dane) {
  let newObj = {
    $: {
      Ocena: "",
      id: "",
      Kraj: "",
    },
    nazwa: "",
    dataZalozenia: "",
    siedziba: "",
    udzialowcy: "",
    liczbaSprzedanychAut: "",
    czyBankrut: "",
    udzialwRynku: {
      _: "",
      $: {
        jednostka: "%",
      },
    },
  };
  for (const [key, value] of Object.entries(dane)) {
    switch (key) {
      case "Ocena":
        if (value.match("[1-5].[0-5]")) {
          newObj.$.Ocena = value;
          break;
        }
      case "udzialwRynku":
        if (value.match("[1-5].[0-5]")) {
          newObj.udzialwRynku._ = value;
          break;
        }
      case "bankrut":
        if (value == "tak" || value == "nie") {
          newObj.czyBankrut = value;
          break;
        }
      case "siedziba":
        if (value != "") {
          newObj.siedziba = value;
          break;
        }
      case "Kraj":
        if (value == "") {
          newObj.$.Kraj = "Brak";
          break;
        }
      case "dataZalozenia":
        if (
          value.match(
            "((0[1-9])|(1[0-9])|(2[0-9])|(3[0-1])).((0[1-9])|(1[0-2])).[0-9]{4}"
          )
        ) {
          newObj.dataZalozenia = value;
          break;
        }
      default:
        newObj[key] = value;
        break;
    }
  }
  return newObj;
}

module.exports = router;