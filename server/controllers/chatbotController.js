const Brand = require("../models/carBrand");
const Car = require("../models/carModel");


function extractKeywords(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/gi, "")
        .split(" ")
        .filter(w => w.length > 2)
        .slice(0, 10);
}

function normalizePrice(str) {
    return Number(String(str).replace(/[^0-9]/g, ""));
}

const chatbot = async (req, res) => {
    const { message } = req.body;
    const keywords = extractKeywords(message);
    console.log("User Keywords:", keywords);

    let responseMessage =
        "Sorry, I couldn't understand that. Can you ask in another way?";

    try {
        
        const brand = await Brand.findOne({
            name: { $regex: keywords.join("|"), $options: "i" },
        });

        if (brand) {
            const cars = await Car.find({ brand: brand._id });

            responseMessage =
                `Here are cars from ${brand.name}:\n\n` +
                cars.map((c) => `• ${c.name} – ₹${c.price}`).join("\n");

            return res.json({ reply: responseMessage });
        }

        const car = await Car.findOne({
            name: { $regex: keywords.join("|"), $options: "i" },
        }).populate("brand");

        if (car) {
            responseMessage =
                `**${car.name}**\n\n` +
                `Brand: ${car.brand?.name}\n` +
                `Price: ₹${car.price}\n` +
                `Fuel: ${car.fuelType}\n` +
                `Transmission: ${car.transmission}\n` +
                `Engine: ${car.engineSize} cc\n` +
                `Mileage: ${car.mileage}\n` +
                `Seater: ${car.seater}\n\n` +
                `Description: ${car.description}`;

            return res.json({ reply: responseMessage });
        }

       
        let minPrice = 0,
            maxPrice = 99999999;

        if (message.includes("under") || message.includes("below")) {
            const number = normalizePrice(message);
            if (number > 0) maxPrice = number;
        }
        if (message.includes("above") || message.includes("more than")) {
            const number = normalizePrice(message);
            if (number > 0) minPrice = number;
        }

        const filteredCars = await Car.find({
            fuelType: { $regex: keywords.join("|"), $options: "i" },
            transmission: { $regex: keywords.join("|"), $options: "i" },
        });

        const finalCars = filteredCars.filter((c) => {
            const p = normalizePrice(c.price);
            return p >= minPrice && p <= maxPrice;
        });

        if (finalCars.length > 0) {
            responseMessage =
                "Here are the cars matching your filters:\n\n" +
                finalCars.map((c) => `• ${c.name} – ₹${c.price}`).join("\n");

            return res.json({ reply: responseMessage });
        }

      
        return res.json({ reply: responseMessage });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ reply: "Something went wrong." });
    }
};

module.exports = { chatbot };
