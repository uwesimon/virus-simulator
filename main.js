"use strict";

let gDebug = 0;

class Disease {
  constructor(waitdays, infectiousdays, symptomdays, infectionrate, nosymptomrate, heavysymptomrate) {
    this.waitdays = waitdays;
    this.infectiousdays = infectiousdays;
    this.symptomdays = symptomdays;
    this.infectionrate = infectionrate;
    this.nosymptomrate = nosymptomrate;
    this.heavysymptomrate = heavysymptomrate;
    //    console.dir(this);
  }
  changeParameters(infectionrate) {
    this.infectionrate = infectionrate;
  }
}

class Person {
  constructor(id, x, y, resistant) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.resistant = resistant;
    this.infectedBy = null;
    this.infected = null;
    this.infectious = null;
    this.symptom = null;
    this.heavysymptom = false;
    this.cured = null;
    this.contacts = 0;
  }

  getId() {
    return (this.id);
  }

  setInfected(day, id, disease) {
    this.infectedBy = id;
    this.infected = day;
    this.infectious = this.infected + disease.waitdays;
    if (Math.random() >= disease.nosymptomrate) {
      this.heavysymptom = (Math.random() < disease.heavysymptomrate);
      this.symptom = this.infectious + disease.infectiousdays;
      this.cured = this.symptom + disease.symptomdays;
    } else {
      this.symptom = this.infectious + disease.symptomdays;
      this.cured = this.infectious + disease.symptomdays;
    }
    //  console.dir(this);
  }

  getResistant() {
    return (this.resistant);
  }

  canBeInfected(today) {
    return (!this.resistant && !this.infected);
  }

  isInfectious(today) {
    return (this.infectious <= today && today < this.symptom);
  }

  isIll(today) {
    return (this.infected <= today && today < this.cured);
  }

  hasSymptom(today) {
    return (this.symptom <= today && today < this.cured);
  }

  hasHeavySymptom(today) {
    return (this.heavysymptom && this.symptom <= today && today < this.cured);
  }

  incContacts() {
    this.contacts++;
  }

  dump() {
    let txt = "";
    txt = txt + " " + this.infected;
    txt = txt + " " + this.infectious;
    txt = txt + " " + this.heavysymptom;
    txt = txt + " " + this.symptom;
    txt = txt + " " + this.cured;
    txt = txt + " " + this.infectedBy
    txt = txt + " " + this.id;
    txt = txt + " " + this.contacts;
    txt = txt + " " + this.resistant;
    txt = txt + "\n";
    return (txt);
  }
}


class Country {
  constructor(xsize, ysize, period, resistantrate, distance, contacts, farratio) {
    this.xsize = xsize;
    this.ysize = ysize;
    this.period = period;
    this.distance = distance;
    this.contacts = contacts;
    this.farratio = farratio;
    this.country = [];
    this.infected = [];
    this.status = [];

    for (let i = 0; i <= this.period; i++) {
      this.status[i] = {
        infected: 0,
        infectious: 0,
        heavysymptom: 0,
        symptom: 0,
        cured: 0
      };
    }

    let nr = 1;
    for (let x = 0; x < this.xsize; x++) {
      this.country[x] = [];
      for (let y = 0; y < this.ysize; y++) {
        this.setPerson(x, y, new Person(nr, x, y, Math.random() < resistantrate));
        nr++;
      }
    }
  }

  changeParameters(distance, contacts, farratio) {
    this.distance = distance;
    this.contacts = contacts;
    this.farratio = farratio;
  }


  setInfected(day, infected) {
    this.infected = infected;
    this.status[day].infected = infected.length;
  }

  getInfected() {
    return (this.infected);
  }

  personInfecting(day, person, disease) {
    let newInfected = [];
    if (person.isIll(day)) {
      newInfected.push(person);
    }
    if (person.isInfectious(day)) {
      this.status[day].infectious++;
      for (let i = 0; i < this.contacts; i++) {
        if (Math.random() < disease.infectionrate) {
          let x = person.x;
          let y = person.y;

          if (Math.random() < this.farratio) {
            // console.log('FAR', this.farratio);
            x = x + (Math.random() * 2 - 1) * this.xsize / 2 | 0;
            y = y + (Math.random() * 2 - 1) * this.ysize / 2 | 0;
          } else {
            // console.log('NEAR');
            x = x + (Math.random() * 2 - 1) * this.distance | 0;
            y = y + (Math.random() * 2 - 1) * this.distance | 0;
          }
          if ((x >= 0 && x < this.xsize) && (y >= 0 && y < this.ysize)) {
            //        x = Math.max(Math.min(x, this.xsize-1),0);
            //        y = Math.max(Math.min(y, this.ysize-1),0);
            //        console.dir({x: x, y:y, px: person.x, py: person.y});
            let newPerson = this.getPerson(x, y);
            newPerson.incContacts();
            if (newPerson.canBeInfected(day)) {
              this.status[day].infected++;
              newPerson.setInfected(day, person.getId(), disease);
              this.setPerson(x, y, newPerson);
              newInfected.push(newPerson);
            }
            //        } else{
            //          console.log('Pos', x, y);
          }
        }
      }
    } else {
      if (person.hasSymptom(day)) {
        if (person.hasHeavySymptom(day)) {
          this.status[day].heavysymptom++;
        } else {
          this.status[day].symptom++;
        }
      } else {
        this.status[day].cured++;
      }
    }
    return (newInfected);
  }

  calcInfections(day, disease) {
    let newInfected = [];
    if (day < this.status.length) {
      for (let person of this.infected) {
        let pInfected = this.personInfecting(day, person, disease);
        for (let person of pInfected) {
          newInfected.push(person);
        };
      };
    };

    this.infected = newInfected;
    if (gDebug) {
      console.dir(infected);
    }
    return (this.infected);
  }

  setPerson(x, y, person) {
    this.country[x][y] = person;
  }

  getPerson(x, y) {
    return (this.country[x][y]);
  }

  dump() {
    let txt = "";
    for (let x = 0; x < xSize; x++) {
      for (let y = 0; y < ySize; y++) {
        txt = txt + this.country[x][y].dump();
      }
    }
    return (txt);
  }

  getStatus(day) {
    return (this.status[day]);
  }
}

let disease = null;
let country = null;

class Simulation {
  constructor(options) {
    this.options = options;
    this.today = 0;
    this.period = options.period;
    this.infected = [];
    this.disease = new Disease(options.waitdays, options.infectiousdays, options.symptomdays, options.infectionrate / 100.0, options.nosymptoms / 100.0, options.heavysymptoms / 100.0);
    this.country = new Country(options.xsize, options.ysize, options.period, options.resistant / 100.0, options.distance, options.contacts, options.farratio / 100.0);
  }


  init() {
    for (let i = 0; i < this.options.initiallyinfected;) {
      let x = Math.random() * this.options.xsize | 0;
      let y = Math.random() * this.options.ysize | 0;
      let person = this.country.getPerson(x, y);
      person.incContacts();
      if (person.canBeInfected()) {
        person.setInfected(this.today, 0, this.disease);
        this.country.setPerson(x, y, person);
        this.infected.push(person);
        i++;
      }
    }

    this.country.setInfected(this.today, this.infected);
  }

  calcBuckets(size) {
    let buckets = [];
    let xSize = size;
    let scale = xSize / this.country.xsize;
    let ySize = this.country.ysize * scale;
    for (let x = 0; x < xSize; x++) {
      buckets.push([]);
      for (let y = 0; y < ySize; y++) {
        buckets[x].push(0);
      }
    }

    for (let x = 0; x < this.country.xsize; x++) {
      for (let y = 0; y < this.country.ysize; y++) {
        if (this.country.country[x][y].infected) {
          buckets[Math.trunc(x * scale)][Math.trunc(y * scale)]++;
        }
      }
    }

    return (buckets);
  };


  changeParameters(distance, contacts, infectionrate, farratio) {
    this.options.distance = distance;
    this.options.contacts = contacts;
    this.options.infectionrate = infectionrate
    this.country.changeParameters(distance, contacts, farratio / 100.0);
    this.disease.changeParameters(infectionrate / 100.0);
  }


  getData() {
    if (this.today < this.country.status.length) {
      return ({
        country: this.country,
        status: this.country.status,
        day: this.today
      });
    } else {
      return (null);
    }
  }

  nextDay() {
    console.dir(this.options);
    this.today++;
    let infections = this.country.calcInfections(this.today, this.disease);
    if (gDebug) {
      console.dir(infections);
    }
    return (infections.length > 0);
  }
}